from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.schemas.events import EventInDB
from app.schemas.venues import VenueInDB
from app.schemas.resources import ResourceInDB
from app.schemas.event_conflicts import (
    ConflictDetectionRequest, 
    ConflictAnalysis, 
    Conflict, 
    ConflictEvidence, 
    AudienceOverlapDetails
)
from app.schemas.users import UserInDB
from app.repositories.base import BaseRepository

class EventConflictService:
    def __init__(
        self,
        event_repo: BaseRepository[EventInDB, Any],
        venue_repo: BaseRepository[VenueInDB, Any],
        resource_repo: BaseRepository[ResourceInDB, Any]
    ):
        self.event_repo = event_repo
        self.venue_repo = venue_repo
        self.resource_repo = resource_repo

    def _ensure_aware(self, dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    def _calculate_overlap_minutes(self, start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> int:
        start1, end1 = self._ensure_aware(start1), self._ensure_aware(end1)
        start2, end2 = self._ensure_aware(start2), self._ensure_aware(end2)
        overlap_start = max(start1, start2)
        overlap_end = min(end1, end2)
        if overlap_start < overlap_end:
            return int((overlap_end - overlap_start).total_seconds() / 60)
        return 0

    def _calculate_jaccard(self, list1: List[str], list2: List[str]) -> float:
        set1 = set([item.lower().strip() for item in list1])
        set2 = set([item.lower().strip() for item in list2])
        if not set1 and not set2:
            return 0.0
        intersection = set1.intersection(set2)
        union = set1.union(set2)
        if not union:
            return 0.0
        return len(intersection) / len(union)

    def _mask_confidential_event(self, event: EventInDB, current_user: UserInDB) -> str:
        # Simplistic masking: if it's not the user's event and the user isn't an admin, mask sensitive titles if needed.
        # For CampusOS Step 5, we'll just return the title, but if we had an explicit 'private' flag we'd mask it.
        return event.title

    async def detect_conflicts(self, request: ConflictDetectionRequest, current_user: UserInDB) -> ConflictAnalysis:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to check event conflicts for event creation"
            )

        if request.end_datetime <= request.start_datetime:
            raise HTTPException(
                status_code=422,
                detail="end_datetime must be after start_datetime"
            )

        conflicts: List[Conflict] = []
        audience_overlaps: List[AudienceOverlapDetails] = []

        # 1. Fetch potentially overlapping events (Time filter)
        # Convert aware datetimes to naive UTC for MongoDB PyMongo queries (which are saved as naive UTC)
        req_start_utc = request.start_datetime.astimezone(timezone.utc).replace(tzinfo=None) if request.start_datetime.tzinfo else request.start_datetime
        req_end_utc = request.end_datetime.astimezone(timezone.utc).replace(tzinfo=None) if request.end_datetime.tzinfo else request.end_datetime

        query: Dict[str, Any] = {
            "start_datetime": {"$lt": req_end_utc},
            "end_datetime": {"$gt": req_start_utc},
            "status": {"$ne": "cancelled"}
        }
        
        if request.event_id:
            from bson import ObjectId
            try:
                # Exclude the current event being updated
                query["_id"] = {"$ne": ObjectId(request.event_id)}
            except Exception:
                pass

        overlapping_events = await self.event_repo.get_all(query=query)

        # Pre-fetch Venue & Resources for requested event
        req_venue = None
        if request.venue_id:
            req_venue = await self.venue_repo.get_by_id(str(request.venue_id))

        req_resources = {}
        for r_id in request.required_resource_ids:
            res = await self.resource_repo.get_by_id(str(r_id))
            if res:
                req_resources[str(r_id)] = res

        # Evaluate each overlapping event
        for ev in overlapping_events:
            overlap_mins = self._calculate_overlap_minutes(
                request.start_datetime, request.end_datetime,
                ev.start_datetime, ev.end_datetime
            )
            
            if overlap_mins <= 0:
                continue

            event_title = self._mask_confidential_event(ev, current_user)

            # 2. Venue Conflict
            if request.venue_id and ev.venue_id and str(request.venue_id) == str(ev.venue_id):
                conflicts.append(Conflict(
                    conflict_type="VENUE",
                    severity="CRITICAL",
                    event_id=str(ev.id),
                    event_title=event_title,
                    explanation="The proposed event overlaps with an existing event using the same venue.",
                    evidence=ConflictEvidence(
                        venue_id=str(request.venue_id),
                        venue_name=req_venue.name if req_venue else None,
                        proposed_time=f"{request.start_datetime.isoformat()} - {request.end_datetime.isoformat()}",
                        existing_time=f"{ev.start_datetime.isoformat()} - {ev.end_datetime.isoformat()}",
                        overlap_minutes=overlap_mins
                    )
                ))

            # 3. Resource Conflict
            # Note: A real resource capacity check would sum up all events happening exactly at the same time.
            # For this MVP, we just check pairwise if they share a resource. If so, we report a capacity conflict or warning.
            if request.required_resource_ids and ev.required_resource_ids:
                shared_resources = set(str(r) for r in request.required_resource_ids).intersection(
                    set(str(r) for r in ev.required_resource_ids)
                )
                for shared_id in shared_resources:
                    res_info = req_resources.get(shared_id)
                    res_name = res_info.name if res_info else "Unknown Resource"
                    
                    # If we don't track requested_quantity per event yet, we just assume 1 or warn.
                    # Since EventCreate doesn't have a quantity map (just list of resource IDs), 
                    # we only know they both need it.
                    conflicts.append(Conflict(
                        conflict_type="RESOURCE",
                        severity="WARNING", # Cannot determine exact capacity exceeded without quantities
                        event_id=str(ev.id),
                        event_title=event_title,
                        explanation=f"Both events require the same resource: {res_name}.",
                        evidence=ConflictEvidence(
                            resource_id=shared_id,
                            resource_name=res_name,
                            capacity_conflict=None,
                            overlap_minutes=overlap_mins
                        )
                    ))

            # 4. Audience Overlap
            if request.target_audience and ev.target_audience:
                score = self._calculate_jaccard(request.target_audience, ev.target_audience)
                if score > 0:
                    shared_audiences = list(set([item.lower().strip() for item in request.target_audience]).intersection(
                        set([item.lower().strip() for item in ev.target_audience])
                    ))
                    audience_overlaps.append(AudienceOverlapDetails(
                        event_id=str(ev.id),
                        event_title=event_title,
                        overlapping_categories=shared_audiences,
                        overlap_score=round(score, 3),
                        calculation_basis=f"Jaccard similarity: intersection({len(shared_audiences)}) / union"
                    ))

        has_conflicts = len(conflicts) > 0
        summary = "No conflicts detected. The event can proceed."
        if has_conflicts:
            summary = f"Detected {len(conflicts)} operational conflicts."

        return ConflictAnalysis(
            has_conflicts=has_conflicts,
            conflicts=conflicts,
            audience_overlaps=audience_overlaps,
            summary=summary
        )
