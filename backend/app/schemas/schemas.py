from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ──────────────────────────────────────────────
# Participant
# ──────────────────────────────────────────────
class ParticipantBase(BaseModel):
    name: str
    email: Optional[str] = None
    avatar_color: Optional[str] = "#6366f1"


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantOut(ParticipantBase):
    id: int

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Chapter
# ──────────────────────────────────────────────
class ChapterBase(BaseModel):
    title: str
    start_time: float
    order_index: int = 0


class ChapterCreate(ChapterBase):
    pass


class ChapterOut(ChapterBase):
    id: int
    meeting_id: int

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Key Topic
# ──────────────────────────────────────────────
class KeyTopicBase(BaseModel):
    topic: str
    order_index: int = 0


class KeyTopicCreate(KeyTopicBase):
    pass


class KeyTopicOut(KeyTopicBase):
    id: int
    summary_id: int

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
class SummaryBase(BaseModel):
    overview: str


class SummaryCreate(SummaryBase):
    key_topics: Optional[List[KeyTopicCreate]] = []


class SummaryUpdate(BaseModel):
    overview: Optional[str] = None
    key_topics: Optional[List[KeyTopicCreate]] = None


class SummaryOut(SummaryBase):
    id: int
    meeting_id: int
    key_topics: List[KeyTopicOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Action Item
# ──────────────────────────────────────────────
class ActionItemBase(BaseModel):
    assignee_name: str
    text: str
    is_completed: bool = False
    due_date: Optional[datetime] = None


class ActionItemCreate(ActionItemBase):
    pass


class ActionItemUpdate(BaseModel):
    assignee_name: Optional[str] = None
    text: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[datetime] = None


class ActionItemOut(ActionItemBase):
    id: int
    meeting_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Transcript Segment
# ──────────────────────────────────────────────
class TranscriptSegmentBase(BaseModel):
    speaker_name: str
    start_time: float
    end_time: Optional[float] = None
    text: str
    sequence_order: int = 0


class TranscriptSegmentCreate(TranscriptSegmentBase):
    participant_id: Optional[int] = None


class TranscriptSegmentOut(TranscriptSegmentBase):
    id: int
    meeting_id: int
    participant_id: Optional[int] = None

    model_config = {"from_attributes": True}


class TranscriptBulkCreate(BaseModel):
    segments: List[TranscriptSegmentCreate]
    replace: bool = False  # if True, clears existing transcript


# ──────────────────────────────────────────────
# Meeting
# ──────────────────────────────────────────────
class MeetingParticipantIn(BaseModel):
    """Used when creating/updating meetings with inline participant info."""
    name: str
    email: Optional[str] = None
    avatar_color: Optional[str] = "#6366f1"
    role: str = "attendee"


class MeetingBase(BaseModel):
    title: str
    date: datetime
    duration_seconds: int = 0
    recording_url: Optional[str] = None


class MeetingCreate(MeetingBase):
    participants: Optional[List[MeetingParticipantIn]] = []
    transcript_text: Optional[str] = None  # raw text paste


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    recording_url: Optional[str] = None
    participants: Optional[List[MeetingParticipantIn]] = None


class MeetingListItem(BaseModel):
    """Lightweight meeting representation for list view."""
    id: int
    title: str
    date: datetime
    duration_seconds: int
    recording_url: Optional[str] = None
    participants: List[ParticipantOut] = []
    action_item_count: int = 0
    transcript_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class MeetingDetail(MeetingListItem):
    """Full meeting with nested data."""
    summary: Optional[SummaryOut] = None
    action_items: List[ActionItemOut] = []
    chapters: List[ChapterOut] = []
    updated_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Pagination / Filtering
# ──────────────────────────────────────────────
class MeetingListResponse(BaseModel):
    items: List[MeetingListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
