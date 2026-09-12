"""
CampusOS AI Agent

Responsible for:
- permission-aware evidence retrieval
- conflict-aware reasoning
- LLM generation
- deterministic fallback when Gemini is unavailable
- structured claims and source attribution

Design principle:
    No evidence -> no confident answer.

The AI provider is optional for the demo.
MongoDB evidence remains the source of truth.
"""

import json
import logging
import time
from typing import Any, Dict, List, Optional

from app.schemas.ai import (
    AIClaim,
    AIQueryRequest,
    AIQueryResponse,
    ClaimType,
)
from app.schemas.users import UserInDB

from app.services.ai_provider import (
    AIProvider,
    AIProviderError,
)
from app.services.ai_retrieval import (
    AIRetrievalService,
)


logger = logging.getLogger(__name__)


# ============================================================
# CONSTANTS
# ============================================================

CONFLICT_KEYWORDS = [
    "conflict",
    "schedule",
    "scheduled",
    "hackathon",
    "clash",
    "overlap",
    "availability",
    "available",
    "book",
    "reserve",
    "venue",
    "room",
]

UPCOMING_STATUSES = {
    "scheduled",
    "upcoming",
    "published",
    "approved",
    "active",
}


SYSTEM_PROMPT_TEMPLATE = """
You are CampusOS, an AI-powered institutional intelligence agent.

Authenticated user role:
{role}

You answer ONLY from the evidence provided below.

EVIDENCE:
{evidence_json}

CORE RULES:
1. Never invent institutional facts.
2. Never assume information that is not present in evidence.
3. Verified facts must be directly supported by evidence.
4. Calculations must be marked DERIVED.
5. Advice must be marked RECOMMENDATION.
6. If evidence is insufficient, explicitly say so.
7. Do not reveal internal IDs, passwords, tokens, or restricted fields.
8. Respect the user's access level.
9. For scheduling questions, rely on institutional event and resource data.
10. Keep answers concise and operational.

Return exactly this format:

ANSWER:
<2-4 sentence answer>

CLAIMS:
- [VERIFIED] <fact> | source: <source>
- [DERIVED] <calculation> | source: <source>
- [RECOMMENDATION] <recommendation> | source: <source>
- [INSUFFICIENT_EVIDENCE] <limitation>

RECOMMENDATIONS:
- <recommendation>

SOURCES:
<comma-separated sources>
""".strip()


# ============================================================
# SERVICE
# ============================================================

class AIAgentService:
    """
    Main CampusOS AI orchestration service.

    Normal path:
        question
          -> permission-aware retrieval
          -> Gemini
          -> structured response

    Fallback path:
        question
          -> permission-aware retrieval
          -> deterministic MongoDB answer

    This means the demo remains functional even when
    the external Gemini provider is unavailable.
    """

    def __init__(
        self,
        retrieval_service: AIRetrievalService,
        provider: AIProvider,
    ) -> None:
        self.retrieval_service = retrieval_service
        self.provider = provider

    # ========================================================
    # BASIC HELPERS
    # ========================================================

    @staticmethod
    def _normalise(value: Any) -> str:
        return str(value).strip().lower()

    @staticmethod
    def _first_value(
        data: Dict[str, Any],
        *keys: str,
        default: Any = None,
    ) -> Any:
        for key in keys:
            if key in data and data[key] is not None:
                return data[key]

        return default

    def _is_conflict_question(
        self,
        question: str,
    ) -> bool:
        question_lower = self._normalise(question)

        return any(
            keyword in question_lower
            for keyword in CONFLICT_KEYWORDS
        )

    def _get_events(
        self,
        evidence: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        events = evidence.get("events", [])

        if not isinstance(events, list):
            return []

        return [
            event
            for event in events
            if isinstance(event, dict)
        ]

    def _get_clubs(
        self,
        evidence: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        clubs = evidence.get("clubs", [])

        if not isinstance(clubs, list):
            return []

        return [
            club
            for club in clubs
            if isinstance(club, dict)
        ]

    def _get_sources(
        self,
        evidence: Dict[str, Any],
    ) -> List[str]:
        sources = evidence.get("sources", [])

        if not isinstance(sources, list):
            return []

        return [
            str(source)
            for source in sources
            if source
        ]

    # ========================================================
    # EVENT HELPERS
    # ========================================================

    def _event_title(
        self,
        event: Dict[str, Any],
    ) -> str:
        return str(
            self._first_value(
                event,
                "title",
                "name",
                default="Unnamed Event",
            )
        )

    def _event_status(
        self,
        event: Dict[str, Any],
    ) -> str:
        return self._normalise(
            self._first_value(
                event,
                "status",
                default="unknown",
            )
        )

    def _event_registration_count(
        self,
        event: Dict[str, Any],
    ) -> int:
        value = self._first_value(
            event,
            "registration_count",
            "registrations_count",
            "registered_count",
            "registrationCount",
            "registeredCount",
            default=0,
        )

        try:
            return int(value)
        except (TypeError, ValueError):
            return 0

    def _event_attendance_count(
        self,
        event: Dict[str, Any],
    ) -> int:
        value = self._first_value(
            event,
            "attendance_count",
            "attended_count",
            "attendanceCount",
            "attendedCount",
            default=0,
        )

        try:
            return int(value)
        except (TypeError, ValueError):
            return 0

    def _event_capacity(
        self,
        event: Dict[str, Any],
    ) -> Optional[int]:
        value = self._first_value(
            event,
            "capacity",
            "venue_capacity",
            "expected_participants",
            "expectedParticipants",
            default=None,
        )

        try:
            return int(value) if value is not None else None
        except (TypeError, ValueError):
            return None

    def _event_rating(
        self,
        event: Dict[str, Any],
    ) -> Optional[float]:
        value = self._first_value(
            event,
            "average_feedback_rating",
            "avg_feedback_rating",
            "feedback_rating",
            "averageFeedbackRating",
            "rating",
            default=None,
        )

        try:
            return float(value) if value is not None else None
        except (TypeError, ValueError):
            return None

    # ========================================================
    # CLUB HELPERS
    # ========================================================

    def _club_name(
        self,
        club: Dict[str, Any],
    ) -> str:
        return str(
            self._first_value(
                club,
                "name",
                "title",
                default="Unknown Club",
            )
        )

    def _club_event_count(
        self,
        club: Dict[str, Any],
    ) -> int:
        value = self._first_value(
            club,
            "event_count",
            "events_count",
            "activity_count",
            "eventCount",
            default=0,
        )

        try:
            return int(value)
        except (TypeError, ValueError):
            return 0

    # ========================================================
    # DETERMINISTIC FALLBACK
    # ========================================================

    async def _deterministic_fallback(
        self,
        question: str,
        evidence: Dict[str, Any],
        current_user: UserInDB,
        start_ms: int,
    ) -> AIQueryResponse:
        """
        Evidence-backed answer generator used when Gemini
        cannot be called.

        It never invents data.
        """

        q = self._normalise(question)

        events = self._get_events(evidence)
        clubs = self._get_clubs(evidence)
        sources = self._get_sources(evidence)

        logger.info(
            "Running deterministic AI fallback for role=%s",
            current_user.role,
        )

        # ====================================================
        # 1. HIGHEST REGISTRATIONS
        # ====================================================

        if (
            "highest registration" in q
            or "highest registrations" in q
            or "most registration" in q
            or "most registrations" in q
            or "most registered" in q
            or "popular event" in q
        ):
            ranked_events = sorted(
                events,
                key=self._event_registration_count,
                reverse=True,
            )

            ranked_events = [
                event
                for event in ranked_events
                if self._event_registration_count(event) > 0
            ]

            if ranked_events:

                top_events = ranked_events[:5]

                ranking = []

                claims = []

                for event in top_events:
                    title = self._event_title(event)
                    count = self._event_registration_count(event)

                    ranking.append(
                        f"{title} ({count} registrations)"
                    )

                    claims.append(
                        AIClaim(
                            type=ClaimType.VERIFIED,
                            text=(
                                f"{title} has "
                                f"{count} registrations."
                            ),
                            source="registrations",
                        )
                    )

                return AIQueryResponse(
                    answer=(
                        "Based on the retrieved CampusOS data, "
                        "the highest-registration events are: "
                        + ", ".join(ranking)
                        + "."
                    ),
                    claims=claims,
                    recommendations=[
                        "Use registration trends together with attendance and feedback when planning future events."
                    ],
                    sources=list(
                        set(
                            sources
                            + [
                                "events",
                                "registrations",
                            ]
                        )
                    ),
                    processing_time_ms=(
                        int(time.time() * 1000)
                        - start_ms
                    ),
                    role_context=current_user.role,
                )

        # ====================================================
        # 2. EVENTS THIS WEEK / UPCOMING EVENTS
        # ====================================================

        if (
            "events happening" in q
            or "events this week" in q
            or "what events" in q
            or "upcoming events" in q
            or "events coming up" in q
        ):
            upcoming_events = [
                event
                for event in events
                if self._event_status(event)
                in UPCOMING_STATUSES
            ]

            if upcoming_events:

                upcoming_events = upcoming_events[:10]

                names = [
                    self._event_title(event)
                    for event in upcoming_events
                ]

                claims = [
                    AIClaim(
                        type=ClaimType.VERIFIED,
                        text=(
                            f"{self._event_title(event)} is "
                            "listed as an upcoming event."
                        ),
                        source="events",
                    )
                    for event in upcoming_events
                ]

                return AIQueryResponse(
                    answer=(
                        f"CampusOS currently shows "
                        f"{len(upcoming_events)} upcoming "
                        "scheduled events: "
                        + ", ".join(names)
                        + "."
                    ),
                    claims=claims,
                    recommendations=[],
                    sources=list(
                        set(
                            sources
                            + ["events"]
                        )
                    ),
                    processing_time_ms=(
                        int(time.time() * 1000)
                        - start_ms
                    ),
                    role_context=current_user.role,
                )

        # ====================================================
        # 3. TOTAL EVENT COUNT
        # ====================================================

        if (
            "total event count" in q
            or "how many events" in q
            or "event count" in q
            or "total events" in q
        ):
            count = len(events)

            if count > 0:

                return AIQueryResponse(
                    answer=(
                        f"The retrieved CampusOS dataset "
                        f"contains {count} events."
                    ),
                    claims=[
                        AIClaim(
                            type=ClaimType.VERIFIED,
                            text=(
                                f"{count} events were retrieved "
                                "from the institutional event data."
                            ),
                            source="events",
                        )
                    ],
                    recommendations=[],
                    sources=list(
                        set(
                            sources
                            + ["events"]
                        )
                    ),
                    processing_time_ms=(
                        int(time.time() * 1000)
                        - start_ms
                    ),
                    role_context=current_user.role,
                )

        # ====================================================
        # 4. HACKATHON PERFORMANCE
        # ====================================================

        if (
            "hackathon" in q
            or "how did" in q
            or "event performance" in q
            or (
                "performance" in q
                and "event" in q
            )
        ):
            hackathons = [
                event
                for event in events
                if "hackathon"
                in self._normalise(
                    self._event_title(event)
                )
            ]

            if hackathons:

                summaries: List[str] = []
                claims: List[AIClaim] = []

                for event in hackathons:

                    title = self._event_title(event)

                    registrations = (
                        self._event_registration_count(
                            event
                        )
                    )

                    attendance = (
                        self._event_attendance_count(
                            event
                        )
                    )

                    rating = (
                        self._event_rating(event)
                    )

                    summary = (
                        f"{title} had "
                        f"{registrations} registrations"
                    )

                    if attendance > 0:
                        summary += (
                            f" and "
                            f"{attendance} recorded attendees"
                        )

                    if rating is not None:
                        summary += (
                            f", with an average feedback "
                            f"rating of {rating:.1f}/5"
                        )

                    summaries.append(summary)

                    claims.append(
                        AIClaim(
                            type=ClaimType.VERIFIED,
                            text=summary + ".",
                            source="events",
                        )
                    )

                return AIQueryResponse(
                    answer=(
                        " ".join(summaries)
                        + "."
                    ),
                    claims=claims,
                    recommendations=[
                        "Compare registrations, attendance, feedback and spending before planning the next hackathon."
                    ],
                    sources=list(
                        set(
                            sources
                            + [
                                "events",
                                "registrations",
                                "attendance",
                                "feedback",
                            ]
                        )
                    ),
                    processing_time_ms=(
                        int(time.time() * 1000)
                        - start_ms
                    ),
                    role_context=current_user.role,
                )

        # ====================================================
        # 5. CLUB ACTIVITY
        # ====================================================

        if (
            "most active club" in q
            or "most active clubs" in q
            or "which clubs are most active" in q
            or "active clubs" in q
        ):

            if clubs:

                ranked_clubs = sorted(
                    clubs,
                    key=self._club_event_count,
                    reverse=True,
                )

                top_clubs = ranked_clubs[:5]

                descriptions = []

                claims = []

                for club in top_clubs:

                    name = self._club_name(club)
                    count = self._club_event_count(club)

                    descriptions.append(
                        f"{name} ({count} events)"
                    )

                    claims.append(
                        AIClaim(
                            type=ClaimType.VERIFIED,
                            text=(
                                f"{name} has "
                                f"{count} recorded events."
                            ),
                            source="clubs",
                        )
                    )

                return AIQueryResponse(
                    answer=(
                        "The most active clubs in the "
                        "retrieved data are: "
                        + ", ".join(descriptions)
                        + "."
                    ),
                    claims=claims,
                    recommendations=[],
                    sources=list(
                        set(
                            sources
                            + [
                                "clubs",
                                "events",
                            ]
                        )
                    ),
                    processing_time_ms=(
                        int(time.time() * 1000)
                        - start_ms
                    ),
                    role_context=current_user.role,
                )

        # ====================================================
        # 6. SCHEDULING / CONFLICT
        # ====================================================

        if (
            "schedule" in q
            or "conflict" in q
            or "clash" in q
            or "overlap" in q
            or "available" in q
            or "can i book" in q
            or "reserve" in q
        ):

            return AIQueryResponse(
                answer=(
                    "CampusOS can evaluate a proposed event "
                    "against existing events, venues and "
                    "resources. For an exact answer, run the "
                    "Event Planner conflict check with the "
                    "proposed date, time and venue."
                ),
                claims=[
                    AIClaim(
                        type=ClaimType.RECOMMENDATION,
                        text=(
                            "Run the deterministic conflict "
                            "check before confirming the booking."
                        ),
                        source="events",
                    )
                ],
                recommendations=[
                    "Check venue, time overlap, target audience and shared resources."
                ],
                sources=list(
                    set(
                        sources
                        + [
                            "events",
                            "venues",
                            "resources",
                        ]
                    )
                ),
                processing_time_ms=(
                    int(time.time() * 1000)
                    - start_ms
                ),
                role_context=current_user.role,
            )

        # ====================================================
        # 7. GENERIC EVENT SUMMARY
        # ====================================================

        if events:

            ranked_events = sorted(
                events,
                key=self._event_registration_count,
                reverse=True,
            )

            top_events = ranked_events[:3]

            summary_items = []

            for event in top_events:
                summary_items.append(
                    f"{self._event_title(event)} "
                    f"({self._event_registration_count(event)} "
                    "registrations)"
                )

            return AIQueryResponse(
                answer=(
                    "Gemini is currently unavailable, but "
                    "CampusOS successfully retrieved the "
                    f"institutional event data. "
                    f"{len(events)} events are available; "
                    "the leading events by registration count "
                    "are "
                    + ", ".join(summary_items)
                    + "."
                ),
                claims=[
                    AIClaim(
                        type=ClaimType.VERIFIED,
                        text=(
                            f"{len(events)} events were "
                            "retrieved from CampusOS."
                        ),
                        source="events",
                    ),
                    AIClaim(
                        type=ClaimType.DERIVED,
                        text=(
                            "Events were ranked using their "
                            "recorded registration counts."
                        ),
                        source="events",
                    ),
                ],
                recommendations=[
                    "Retry the query when the external AI provider becomes available for natural-language reasoning."
                ],
                sources=list(
                    set(
                        sources
                        + ["events"]
                    )
                ),
                processing_time_ms=(
                    int(time.time() * 1000)
                    - start_ms
                ),
                role_context=current_user.role,
            )

        # ====================================================
        # 8. NOTHING SUPPORTED
        # ====================================================

        return AIQueryResponse(
            answer=(
                "CampusOS retrieved the available institutional "
                "evidence, but it is insufficient to answer "
                "this question confidently."
            ),
            claims=[
                AIClaim(
                    type=ClaimType.INSUFFICIENT_EVIDENCE,
                    text=(
                        "The available institutional evidence "
                        "does not support a confident answer."
                    ),
                    source=None,
                )
            ],
            recommendations=[],
            sources=sources,
            processing_time_ms=(
                int(time.time() * 1000)
                - start_ms
            ),
            role_context=current_user.role,
        )

    # ========================================================
    # LLM RESPONSE PARSING
    # ========================================================

    def _parse_claim_line(
        self,
        text: str,
    ) -> Optional[AIClaim]:

        text = text.strip()

        claim_type = ClaimType.VERIFIED
        source = None

        for enum_value in ClaimType:

            marker = f"[{enum_value.value}]"

            if text.startswith(marker):

                claim_type = enum_value
                text = text[
                    len(marker):
                ].strip()

                break

        if "| source:" in text:

            claim_text, source_text = (
                text.split(
                    "| source:",
                    1,
                )
            )

            text = claim_text.strip()
            source = source_text.strip()

        if not text:
            return None

        return AIClaim(
            type=claim_type,
            text=text,
            source=source,
        )

    def _parse_llm_response(
        self,
        raw_response: str,
    ) -> Dict[str, Any]:

        answer = ""
        claims: List[AIClaim] = []
        recommendations: List[str] = []
        sources: List[str] = []

        current_section = None

        for raw_line in raw_response.splitlines():

            line = raw_line.strip()

            if not line:
                continue

            if line.startswith("ANSWER:"):

                current_section = "answer"

                answer = line[
                    len("ANSWER:"):
                ].strip()

                continue

            if line.startswith("CLAIMS:"):

                current_section = "claims"
                continue

            if line.startswith("RECOMMENDATIONS:"):

                current_section = "recommendations"
                continue

            if line.startswith("SOURCES:"):

                current_section = "sources"

                source_text = line[
                    len("SOURCES:"):
                ].strip()

                sources = [
                    item.strip()
                    for item
                    in source_text.split(",")
                    if item.strip()
                ]

                continue

            if (
                current_section == "answer"
                and not line.startswith("-")
            ):

                if answer:
                    answer += " " + line
                else:
                    answer = line

                continue

            if (
                current_section == "claims"
                and line.startswith("-")
            ):

                claim = self._parse_claim_line(
                    line[1:].strip()
                )

                if claim:
                    claims.append(claim)

                continue

            if (
                current_section == "recommendations"
                and line.startswith("-")
            ):

                recommendation = (
                    line[1:].strip()
                )

                if recommendation:
                    recommendations.append(
                        recommendation
                    )

        if not answer:

            answer = (
                raw_response.strip()
            )

        return {
            "answer": answer,
            "claims": claims,
            "recommendations": recommendations,
            "sources": sources,
        }

    # ========================================================
    # SANITISE EVIDENCE
    # ========================================================

    def _sanitise_evidence_for_llm(
        self,
        evidence: Dict[str, Any],
    ) -> Dict[str, Any]:

        safe_evidence: Dict[str, Any] = {}

        restricted_keys = {
            "password",
            "password_hash",
            "token",
            "access_token",
            "refresh_token",
            "secret",
            "api_key",
            "user_id",
        }

        for key, value in evidence.items():

            if key.lower() in restricted_keys:
                continue

            if (
                isinstance(value, list)
                and len(value) > 25
            ):
                safe_evidence[key] = value[:25]
            else:
                safe_evidence[key] = value

        return safe_evidence

    # ========================================================
    # MAIN QUERY
    # ========================================================

    async def process_query(
        self,
        request: AIQueryRequest,
        current_user: UserInDB,
    ) -> AIQueryResponse:

        start_ms = int(
            time.time() * 1000
        )

        question = request.question.strip()

        logger.info(
            "Processing CampusOS AI query: role=%s question=%s",
            current_user.role,
            question,
        )

        # ----------------------------------------------------
        # 1. RETRIEVE EVIDENCE
        # ----------------------------------------------------

        try:

            evidence = (
                await self.retrieval_service.get_evidence(
                    current_user,
                    question,
                )
            )

        except Exception as exc:

            logger.error(
                "Evidence retrieval failed: %s",
                exc,
                exc_info=True,
            )

            return AIQueryResponse(
                answer=(
                    "CampusOS could not retrieve the "
                    "institutional data required for this query."
                ),
                claims=[
                    AIClaim(
                        type=ClaimType.INSUFFICIENT_EVIDENCE,
                        text=(
                            "Institutional data retrieval failed."
                        ),
                        source=None,
                    )
                ],
                recommendations=[],
                sources=[],
                processing_time_ms=(
                    int(time.time() * 1000)
                    - start_ms
                ),
                role_context=current_user.role,
            )

        # ----------------------------------------------------
        # 2. CONFLICT CONTEXT
        # ----------------------------------------------------

        conflict_hint = ""

        if self._is_conflict_question(question):

            conflict_hint = (
                "This question may involve schedule or "
                "resource conflicts. Use deterministic "
                "event conflict information where available."
            )

        # ----------------------------------------------------
        # 3. PREPARE LLM PROMPT
        # ----------------------------------------------------

        safe_evidence = (
            self._sanitise_evidence_for_llm(
                evidence
            )
        )

        evidence_json = json.dumps(
            safe_evidence,
            indent=2,
            default=str,
        )

        system_prompt = (
            SYSTEM_PROMPT_TEMPLATE.format(
                role=current_user.role,
                evidence_json=evidence_json,
            )
        )

        user_prompt = (
            f"User question: {question}"
        )

        if conflict_hint:

            user_prompt += (
                f"\n\nOperational note: "
                f"{conflict_hint}"
            )

        # ----------------------------------------------------
        # 4. TRY GEMINI
        # ----------------------------------------------------

        try:

            raw_response = (
                await self.provider.generate(
                    system_prompt,
                    user_prompt,
                )
            )

            parsed = (
                self._parse_llm_response(
                    raw_response
                )
            )

            retrieved_sources = (
                self._get_sources(evidence)
            )

            merged_sources = list(
                set(
                    parsed["sources"]
                    + retrieved_sources
                )
            )

            return AIQueryResponse(
                answer=parsed["answer"],
                claims=parsed["claims"],
                recommendations=(
                    parsed["recommendations"]
                ),
                sources=merged_sources,
                processing_time_ms=(
                    int(time.time() * 1000)
                    - start_ms
                ),
                role_context=current_user.role,
            )

        except AIProviderError as exc:

            logger.warning(
                "Gemini unavailable; switching to "
                "deterministic CampusOS fallback: %s",
                exc,
            )

            return await self._deterministic_fallback(
                question,
                evidence,
                current_user,
                start_ms,
            )

        except Exception as exc:

            logger.error(
                "Unexpected AI provider failure; "
                "switching to deterministic fallback: %s",
                exc,
                exc_info=True,
            )

            return await self._deterministic_fallback(
                question,
                evidence,
                current_user,
                start_ms,
            )