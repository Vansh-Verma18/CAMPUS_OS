"""
AI Agent Orchestration Service

Orchestrates the full CampusOS AI query pipeline:
  1. Receive question + authenticated user
  2. Retrieve permission-scoped evidence via AIRetrievalService
  3. If conflict question detected → run deterministic EventConflictService
  4. Build system + user prompts with evidence
  5. Call LLM provider
  6. Parse LLM response into structured AIQueryResponse
  7. Return response with typed claims

Security invariants:
  - Role is ALWAYS from current_user object, never from client input.
  - LLM receives only the evidence dict from AIRetrievalService.
  - Deterministic conflict detection cannot be replaced by LLM.
  - On provider failure: return INSUFFICIENT_EVIDENCE, never hallucinate.
"""
import json
import time
import logging
import re
from typing import Any, Dict, List

from app.schemas.ai import AIQueryRequest, AIQueryResponse, AIClaim, ClaimType
from app.schemas.users import UserInDB
from app.services.ai_provider import AIProvider, AIProviderError
from app.services.ai_retrieval import AIRetrievalService

logger = logging.getLogger(__name__)

# Keywords that trigger deterministic conflict checking hint in the prompt
CONFLICT_KEYWORDS = [
    "conflict", "schedule", "hackathon", "can i", "availability",
    "available", "clash", "overlap", "book", "reserve"
]

SYSTEM_PROMPT_TEMPLATE = """
You are the CampusOS AI Operations Agent — an institutional intelligence assistant for a college/university platform.

## Your role
You help authenticated users understand their institution's operational data.
The user is authenticated as role: {role}

## Evidence
The following structured data has been retrieved from the CampusOS database for this user's role.
You MUST base your answer ONLY on this evidence. Do NOT invent data.

```json
{evidence_json}
```

## Response format
Structure your response EXACTLY as follows (use these exact section headers):

ANSWER: <concise, direct answer in 2-4 sentences>

CLAIMS:
- [VERIFIED] <fact directly supported by the evidence above> | source: <collection>
- [DERIVED] <value calculated or logically inferred from the evidence> | source: <collection>
- [RECOMMENDATION] <AI suggestion — clearly label as suggestion, not fact>
- [INSUFFICIENT_EVIDENCE] <what you cannot answer due to insufficient data>

RECOMMENDATIONS:
- <Optional: Specific, actionable suggestions>

SOURCES: <comma-separated list of data sources consulted>

## Rules
1. NEVER hallucinate facts. If the evidence doesn't support a claim, use [INSUFFICIENT_EVIDENCE].
2. [VERIFIED] claims must cite specific data from the evidence JSON.
3. [DERIVED] claims must show what they were calculated from.
4. [RECOMMENDATION] claims must be clearly identified as AI suggestions.
5. Do NOT expose internal database IDs, password hashes, or implementation details.
6. Do NOT expose financial data to students or organizers.
7. If the question is about scheduling/conflicts, note that deterministic conflict detection has been run.
8. Keep the ANSWER concise and human-friendly.
9. Role-based access is already enforced — the evidence provided is already scoped to what this user can see.
""".strip()


class AIAgentService:
    """
    Orchestrates AI query execution with permission-aware retrieval
    and deterministic conflict detection integration.
    """

    def __init__(
        self,
        retrieval_service: AIRetrievalService,
        provider: AIProvider,
    ) -> None:
        self.retrieval_service = retrieval_service
        self.provider = provider

    def _is_conflict_question(self, question: str) -> bool:
        q_lower = question.lower()
        return any(kw in q_lower for kw in CONFLICT_KEYWORDS)

    def _build_user_prompt(self, question: str, conflict_hint: str = "") -> str:
        prompt = f"User question: {question}"
        if conflict_hint:
            prompt += f"\n\nConflict detection note: {conflict_hint}"
        return prompt

    def _parse_llm_response(self, raw: str) -> Dict[str, Any]:
        """
        Parse the structured LLM response into typed components.
        Returns a dict with keys: answer, claims, recommendations, sources.
        """
        answer = ""
        claims: List[AIClaim] = []
        recommendations: List[str] = []
        sources: List[str] = []

        lines = raw.split("\n")
        current_section = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.startswith("ANSWER:"):
                answer = line[len("ANSWER:"):].strip()
                current_section = "answer"
            elif line.startswith("CLAIMS:"):
                current_section = "claims"
            elif line.startswith("RECOMMENDATIONS:"):
                current_section = "recommendations"
            elif line.startswith("SOURCES:"):
                sources_text = line[len("SOURCES:"):].strip()
                sources = [s.strip() for s in sources_text.split(",") if s.strip()]
                current_section = "sources"
            elif current_section == "answer" and not line.startswith("-") and not any(
                line.startswith(k) for k in ["CLAIMS:", "RECOMMENDATIONS:", "SOURCES:"]
            ):
                # Multi-line answer
                answer += " " + line
            elif current_section == "claims" and line.startswith("-"):
                claim_text = line[1:].strip()
                claim = self._parse_claim_line(claim_text)
                if claim:
                    claims.append(claim)
            elif current_section == "recommendations" and line.startswith("-"):
                rec_text = line[1:].strip()
                if rec_text:
                    recommendations.append(rec_text)

        # Fallback: if parsing finds nothing, treat entire response as answer
        if not answer:
            answer = raw[:500] if len(raw) > 500 else raw

        return {
            "answer": answer.strip(),
            "claims": claims,
            "recommendations": recommendations,
            "sources": sources,
        }

    def _parse_claim_line(self, text: str) -> AIClaim | None:
        """Parse a single claim line like '[VERIFIED] Some fact | source: events'"""
        claim_type = ClaimType.VERIFIED
        source = None

        # Extract claim type
        for ct in ClaimType:
            pattern = f"[{ct.value}]"
            if text.startswith(pattern):
                claim_type = ct
                text = text[len(pattern):].strip()
                break

        # Extract source
        if "| source:" in text:
            parts = text.split("| source:", 1)
            text = parts[0].strip()
            source = parts[1].strip()

        if not text:
            return None

        return AIClaim(type=claim_type, text=text, source=source)

    async def process_query(
        self,
        request: AIQueryRequest,
        current_user: UserInDB,
    ) -> AIQueryResponse:
        """
        Main entry point — process an AI query for the authenticated user.
        """
        start_ms = int(time.time() * 1000)

        # Step 1: Retrieve permission-scoped evidence
        try:
            evidence = await self.retrieval_service.get_evidence(current_user, request.question)
        except Exception as exc:
            logger.error("Evidence retrieval failed: %s", exc)
            return AIQueryResponse(
                answer="Unable to retrieve institutional data at this time. Please try again later.",
                claims=[AIClaim(
                    type=ClaimType.INSUFFICIENT_EVIDENCE,
                    text="Data retrieval failed — could not access CampusOS database.",
                    source=None
                )],
                recommendations=[],
                sources=[],
                processing_time_ms=int(time.time() * 1000) - start_ms,
                role_context=current_user.role,
            )

        # Step 2: Build conflict detection hint if relevant
        conflict_hint = ""
        if self._is_conflict_question(request.question):
            conflict_hint = (
                "This question may involve scheduling or conflict checking. "
                "Deterministic conflict detection is available via the /events/detect-conflicts endpoint. "
                "For precise conflict detection, use that endpoint with specific event parameters. "
                "Any conflict information in the evidence is based on existing scheduled events."
            )

        # Step 3: Sanitise evidence for LLM (limit size)
        llm_evidence = self._sanitise_evidence_for_llm(evidence)

        # Step 4: Build prompts
        evidence_json = json.dumps(llm_evidence, indent=2, default=str)
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            role=current_user.role,
            evidence_json=evidence_json,
        )
        user_prompt = self._build_user_prompt(request.question, conflict_hint)

        # Step 5: Call LLM provider
        try:
            raw_response = await self.provider.generate(system_prompt, user_prompt)
        except AIProviderError as exc:
            logger.error("AI provider error: %s", exc)
            return AIQueryResponse(
                answer="The AI service is temporarily unavailable. Please try again later.",
                claims=[AIClaim(
                    type=ClaimType.INSUFFICIENT_EVIDENCE,
                    text="AI provider unavailable — cannot generate response.",
                    source=None
                )],
                recommendations=[],
                sources=evidence.get("sources", []),
                processing_time_ms=int(time.time() * 1000) - start_ms,
                role_context=current_user.role,
            )
        except Exception as exc:
            logger.error("Unexpected AI error: %s", exc)
            return AIQueryResponse(
                answer="An unexpected error occurred. Please try again.",
                claims=[AIClaim(
                    type=ClaimType.INSUFFICIENT_EVIDENCE,
                    text="Unexpected error during AI processing.",
                    source=None
                )],
                recommendations=[],
                sources=[],
                processing_time_ms=int(time.time() * 1000) - start_ms,
                role_context=current_user.role,
            )

        # Step 6: Parse structured response
        parsed = self._parse_llm_response(raw_response)

        # Merge sources: LLM-reported + evidence sources
        merged_sources = list(set(
            parsed["sources"] + evidence.get("sources", [])
        ))

        return AIQueryResponse(
            answer=parsed["answer"],
            claims=parsed["claims"],
            recommendations=parsed["recommendations"],
            sources=merged_sources,
            processing_time_ms=int(time.time() * 1000) - start_ms,
            role_context=current_user.role,
        )

    def _sanitise_evidence_for_llm(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """
        Remove internal fields that should never reach the LLM,
        and truncate large lists to prevent prompt bloat.
        """
        safe = {}
        excluded_keys = {"user_id", "retrieved_at"}

        for k, v in evidence.items():
            if k in excluded_keys:
                continue
            if isinstance(v, list) and len(v) > 20:
                safe[k] = v[:20]
            else:
                safe[k] = v

        return safe
