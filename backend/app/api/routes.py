from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    MeetingCreate, MeetingUpdate, MeetingListItem, MeetingDetail,
    MeetingListResponse, TranscriptSegmentOut, TranscriptBulkCreate,
    SummaryCreate, SummaryUpdate, SummaryOut,
    ActionItemCreate, ActionItemUpdate, ActionItemOut,
    ChapterOut, ParticipantOut,
)
from app.services import meeting_service as svc

router = APIRouter()


# ──────────────────────────────────────────────
# Meetings
# ──────────────────────────────────────────────

@router.get("/meetings", response_model=MeetingListResponse)
def list_meetings(
    search: Optional[str] = Query(None),
    participant: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    sort: str = Query("newest", pattern="^(newest|oldest)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return svc.list_meetings(
        db, search=search, participant=participant,
        from_date=from_date, to_date=to_date, sort=sort,
        page=page, page_size=page_size,
    )


@router.post("/meetings", response_model=MeetingListItem, status_code=201)
def create_meeting(data: MeetingCreate, db: Session = Depends(get_db)):
    meeting = svc.create_meeting(db, data)
    return svc._build_list_item(meeting, db)


@router.get("/meetings/{meeting_id}", response_model=MeetingDetail)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = svc.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    from app.schemas.schemas import (
        SummaryOut, KeyTopicOut, ActionItemOut, ChapterOut, ParticipantOut, MeetingDetail
    )
    from sqlalchemy import func
    from app.models.models import TranscriptSegment, ActionItem

    participants = [
        ParticipantOut.model_validate(mp.participant)
        for mp in meeting.meeting_participants
        if mp.participant
    ]
    action_item_count = len(meeting.action_items)
    transcript_count = (
        db.query(func.count(TranscriptSegment.id))
        .filter(TranscriptSegment.meeting_id == meeting_id)
        .scalar() or 0
    )

    summary_out = None
    if meeting.summary:
        summary_out = SummaryOut.model_validate(meeting.summary)

    action_items_out = [ActionItemOut.model_validate(ai) for ai in meeting.action_items]
    chapters_out = [ChapterOut.model_validate(ch) for ch in meeting.chapters]

    return MeetingDetail(
        id=meeting.id,
        title=meeting.title,
        date=meeting.date,
        duration_seconds=meeting.duration_seconds,
        recording_url=meeting.recording_url,
        participants=participants,
        action_item_count=action_item_count,
        transcript_count=transcript_count,
        created_at=meeting.created_at,
        updated_at=meeting.updated_at,
        summary=summary_out,
        action_items=action_items_out,
        chapters=chapters_out,
    )


@router.patch("/meetings/{meeting_id}", response_model=MeetingListItem)
def update_meeting(meeting_id: int, data: MeetingUpdate, db: Session = Depends(get_db)):
    meeting = svc.update_meeting(db, meeting_id, data)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return svc._build_list_item(meeting, db)


@router.delete("/meetings/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    ok = svc.delete_meeting(db, meeting_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Meeting not found")


# ──────────────────────────────────────────────
# Transcript
# ──────────────────────────────────────────────

@router.get("/meetings/{meeting_id}/transcript", response_model=list[TranscriptSegmentOut])
def get_transcript(meeting_id: int, db: Session = Depends(get_db)):
    # Verify meeting exists
    meeting = db.query(svc.Meeting).filter(svc.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return svc.get_transcript(db, meeting_id)


@router.post("/meetings/{meeting_id}/transcript", response_model=list[TranscriptSegmentOut], status_code=201)
def upload_transcript(meeting_id: int, data: TranscriptBulkCreate, db: Session = Depends(get_db)):
    meeting = db.query(svc.Meeting).filter(svc.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    svc.bulk_add_transcript(db, meeting_id, data.segments, data.replace)
    return svc.get_transcript(db, meeting_id)


# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────

@router.get("/meetings/{meeting_id}/summary", response_model=SummaryOut)
def get_summary(meeting_id: int, db: Session = Depends(get_db)):
    from app.models.models import Summary
    s = db.query(Summary).filter(Summary.meeting_id == meeting_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Summary not found")
    return s


@router.put("/meetings/{meeting_id}/summary", response_model=SummaryOut)
def upsert_summary(meeting_id: int, data: SummaryCreate, db: Session = Depends(get_db)):
    meeting = db.query(svc.Meeting).filter(svc.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return svc.upsert_summary(db, meeting_id, data.overview, data.key_topics or [])


# ──────────────────────────────────────────────
# Action Items
# ──────────────────────────────────────────────

@router.get("/meetings/{meeting_id}/action-items", response_model=list[ActionItemOut])
def list_action_items(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(svc.Meeting).filter(svc.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return svc.list_action_items(db, meeting_id)


@router.post("/meetings/{meeting_id}/action-items", response_model=ActionItemOut, status_code=201)
def create_action_item(meeting_id: int, data: ActionItemCreate, db: Session = Depends(get_db)):
    meeting = db.query(svc.Meeting).filter(svc.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return svc.create_action_item(db, meeting_id, data)


@router.patch("/action-items/{item_id}", response_model=ActionItemOut)
def update_action_item(item_id: int, data: ActionItemUpdate, db: Session = Depends(get_db)):
    ai = svc.update_action_item(db, item_id, data)
    if not ai:
        raise HTTPException(status_code=404, detail="Action item not found")
    return ai


@router.delete("/action-items/{item_id}", status_code=204)
def delete_action_item(item_id: int, db: Session = Depends(get_db)):
    ok = svc.delete_action_item(db, item_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Action item not found")


# ──────────────────────────────────────────────
# Chapters
# ──────────────────────────────────────────────

@router.get("/meetings/{meeting_id}/chapters", response_model=list[ChapterOut])
def list_chapters(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(svc.Meeting).filter(svc.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return svc.list_chapters(db, meeting_id)


# ──────────────────────────────────────────────
# Participants
# ──────────────────────────────────────────────

@router.get("/participants", response_model=list[ParticipantOut])
def list_participants(db: Session = Depends(get_db)):
    return svc.list_participants(db)
