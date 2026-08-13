"""
Meeting service — business logic layer.
All DB operations go through this service, not directly in route handlers.
"""
import math
from datetime import datetime
from typing import Optional, List, Tuple

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, desc, asc

from app.models.models import (
    Meeting, Participant, MeetingParticipant,
    TranscriptSegment, Summary, KeyTopic, ActionItem, Chapter
)
from app.schemas.schemas import (
    MeetingCreate, MeetingUpdate, MeetingListItem, MeetingDetail,
    MeetingListResponse, ParticipantOut, SummaryOut, ActionItemOut,
    ChapterOut, KeyTopicOut
)


def _get_or_create_participant(db: Session, name: str, email: Optional[str], avatar_color: str) -> Participant:
    """Find existing participant by email or name, or create a new one."""
    if email:
        p = db.query(Participant).filter(Participant.email == email).first()
        if p:
            return p
    p = db.query(Participant).filter(Participant.name == name).first()
    if p:
        return p
    p = Participant(name=name, email=email, avatar_color=avatar_color)
    db.add(p)
    db.flush()
    return p


def _build_list_item(meeting: Meeting, db: Session) -> MeetingListItem:
    participants = [
        ParticipantOut.model_validate(mp.participant)
        for mp in meeting.meeting_participants
        if mp.participant
    ]
    action_item_count = db.query(func.count(ActionItem.id)).filter(
        ActionItem.meeting_id == meeting.id
    ).scalar() or 0
    transcript_count = db.query(func.count(TranscriptSegment.id)).filter(
        TranscriptSegment.meeting_id == meeting.id
    ).scalar() or 0

    return MeetingListItem(
        id=meeting.id,
        title=meeting.title,
        date=meeting.date,
        duration_seconds=meeting.duration_seconds,
        recording_url=meeting.recording_url,
        participants=participants,
        action_item_count=action_item_count,
        transcript_count=transcript_count,
        created_at=meeting.created_at,
    )


def list_meetings(
    db: Session,
    search: Optional[str] = None,
    participant: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 20,
) -> MeetingListResponse:
    query = (
        db.query(Meeting)
        .options(
            joinedload(Meeting.meeting_participants).joinedload(MeetingParticipant.participant)
        )
    )

    if search:
        query = query.filter(Meeting.title.ilike(f"%{search}%"))

    if participant:
        query = (
            query
            .join(Meeting.meeting_participants)
            .join(MeetingParticipant.participant)
            .filter(Participant.name.ilike(f"%{participant}%"))
        )

    if from_date:
        query = query.filter(Meeting.date >= from_date)

    if to_date:
        query = query.filter(Meeting.date <= to_date)

    total = query.count()

    if sort == "oldest":
        query = query.order_by(asc(Meeting.date))
    else:
        query = query.order_by(desc(Meeting.date))

    offset = (page - 1) * page_size
    meetings = query.offset(offset).limit(page_size).all()

    items = [_build_list_item(m, db) for m in meetings]

    return MeetingListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


def create_meeting(db: Session, data: MeetingCreate) -> Meeting:
    meeting = Meeting(
        title=data.title,
        date=data.date,
        duration_seconds=data.duration_seconds,
        recording_url=data.recording_url,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(meeting)
    db.flush()

    for p_in in (data.participants or []):
        p = _get_or_create_participant(db, p_in.name, p_in.email, p_in.avatar_color)
        mp = MeetingParticipant(meeting_id=meeting.id, participant_id=p.id, role=p_in.role)
        db.add(mp)

    # If raw transcript text was provided, parse into segments
    if data.transcript_text:
        _parse_and_store_transcript(db, meeting.id, data.transcript_text)

    db.commit()
    db.refresh(meeting)
    return meeting


def get_meeting(db: Session, meeting_id: int) -> Optional[Meeting]:
    return (
        db.query(Meeting)
        .options(
            joinedload(Meeting.meeting_participants).joinedload(MeetingParticipant.participant),
            joinedload(Meeting.summary).joinedload(Summary.key_topics),
            joinedload(Meeting.action_items),
            joinedload(Meeting.chapters),
        )
        .filter(Meeting.id == meeting_id)
        .first()
    )


def update_meeting(db: Session, meeting_id: int, data: MeetingUpdate) -> Optional[Meeting]:
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        return None

    if data.title is not None:
        meeting.title = data.title
    if data.date is not None:
        meeting.date = data.date
    if data.duration_seconds is not None:
        meeting.duration_seconds = data.duration_seconds
    if data.recording_url is not None:
        meeting.recording_url = data.recording_url
    meeting.updated_at = datetime.utcnow()

    if data.participants is not None:
        # Remove old participants
        db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting_id).delete()
        for p_in in data.participants:
            p = _get_or_create_participant(db, p_in.name, p_in.email, p_in.avatar_color)
            mp = MeetingParticipant(meeting_id=meeting.id, participant_id=p.id, role=p_in.role)
            db.add(mp)

    db.commit()
    db.refresh(meeting)
    return meeting


def delete_meeting(db: Session, meeting_id: int) -> bool:
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        return False
    db.delete(meeting)
    db.commit()
    return True


def get_transcript(db: Session, meeting_id: int) -> List[TranscriptSegment]:
    return (
        db.query(TranscriptSegment)
        .filter(TranscriptSegment.meeting_id == meeting_id)
        .order_by(TranscriptSegment.sequence_order)
        .all()
    )


def bulk_add_transcript(db: Session, meeting_id: int, segments: list, replace: bool = False):
    if replace:
        db.query(TranscriptSegment).filter(TranscriptSegment.meeting_id == meeting_id).delete()

    for seg in segments:
        ts = TranscriptSegment(
            meeting_id=meeting_id,
            participant_id=seg.participant_id,
            speaker_name=seg.speaker_name,
            start_time=seg.start_time,
            end_time=seg.end_time,
            text=seg.text,
            sequence_order=seg.sequence_order,
        )
        db.add(ts)
    db.commit()


def upsert_summary(db: Session, meeting_id: int, overview: str, key_topics: list) -> Summary:
    summary = db.query(Summary).filter(Summary.meeting_id == meeting_id).first()
    if not summary:
        summary = Summary(meeting_id=meeting_id, overview=overview)
        db.add(summary)
        db.flush()
    else:
        summary.overview = overview
        summary.updated_at = datetime.utcnow()
        # Remove old topics
        db.query(KeyTopic).filter(KeyTopic.summary_id == summary.id).delete()

    for i, kt in enumerate(key_topics):
        topic = KeyTopic(summary_id=summary.id, topic=kt.topic, order_index=i)
        db.add(topic)

    db.commit()
    db.refresh(summary)
    return summary


# Action items
def list_action_items(db: Session, meeting_id: int) -> List[ActionItem]:
    return db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).all()


def create_action_item(db: Session, meeting_id: int, data) -> ActionItem:
    ai = ActionItem(
        meeting_id=meeting_id,
        assignee_name=data.assignee_name,
        text=data.text,
        is_completed=data.is_completed,
        due_date=data.due_date,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(ai)
    db.commit()
    db.refresh(ai)
    return ai


def update_action_item(db: Session, item_id: int, data) -> Optional[ActionItem]:
    ai = db.query(ActionItem).filter(ActionItem.id == item_id).first()
    if not ai:
        return None
    if data.assignee_name is not None:
        ai.assignee_name = data.assignee_name
    if data.text is not None:
        ai.text = data.text
    if data.is_completed is not None:
        ai.is_completed = data.is_completed
    if data.due_date is not None:
        ai.due_date = data.due_date
    ai.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ai)
    return ai


def delete_action_item(db: Session, item_id: int) -> bool:
    ai = db.query(ActionItem).filter(ActionItem.id == item_id).first()
    if not ai:
        return False
    db.delete(ai)
    db.commit()
    return True


def list_chapters(db: Session, meeting_id: int) -> List[Chapter]:
    return (
        db.query(Chapter)
        .filter(Chapter.meeting_id == meeting_id)
        .order_by(Chapter.order_index)
        .all()
    )


def list_participants(db: Session) -> List[Participant]:
    return db.query(Participant).order_by(Participant.name).all()


def _parse_and_store_transcript(db: Session, meeting_id: int, text: str):
    """Parse simple VTT or plain text into transcript segments."""
    lines = text.strip().split("\n")
    segments = []
    seq = 0

    # Try VTT format
    if lines and lines[0].strip() == "WEBVTT":
        i = 1
        while i < len(lines):
            # Skip blank + cue identifier lines
            while i < len(lines) and not "-->" in lines[i]:
                i += 1
            if i >= len(lines):
                break
            # Parse timestamp line: 00:00:03.000 --> 00:00:07.000
            ts_line = lines[i]
            i += 1
            try:
                start_str, end_str = ts_line.split("-->")
                start = _vtt_time_to_seconds(start_str.strip())
                end = _vtt_time_to_seconds(end_str.strip().split()[0])
            except Exception:
                continue

            # Collect text lines
            text_lines = []
            while i < len(lines) and lines[i].strip():
                text_lines.append(lines[i].strip())
                i += 1

            if text_lines:
                speaker = "Unknown"
                text_content = " ".join(text_lines)
                if "<v " in text_content:
                    import re
                    m = re.match(r"<v ([^>]+)>(.*)", text_content, re.DOTALL)
                    if m:
                        speaker = m.group(1)
                        text_content = m.group(2).replace("</v>", "").strip()

                segments.append(TranscriptSegment(
                    meeting_id=meeting_id,
                    speaker_name=speaker,
                    start_time=start,
                    end_time=end,
                    text=text_content,
                    sequence_order=seq,
                ))
                seq += 1
    else:
        # Plain text: each line becomes a segment attributed to "Speaker"
        for line in lines:
            line = line.strip()
            if not line:
                continue
            segments.append(TranscriptSegment(
                meeting_id=meeting_id,
                speaker_name="Speaker",
                start_time=seq * 10.0,
                end_time=(seq + 1) * 10.0,
                text=line,
                sequence_order=seq,
            ))
            seq += 1

    for seg in segments:
        db.add(seg)


def _vtt_time_to_seconds(t: str) -> float:
    parts = t.replace(",", ".").split(":")
    if len(parts) == 3:
        h, m, s = parts
        return int(h) * 3600 + int(m) * 60 + float(s)
    elif len(parts) == 2:
        m, s = parts
        return int(m) * 60 + float(s)
    return float(parts[0])
