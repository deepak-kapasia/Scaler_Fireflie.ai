from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
    ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    duration_seconds = Column(Integer, default=0)
    recording_url = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    meeting_participants = relationship(
        "MeetingParticipant", back_populates="meeting", cascade="all, delete-orphan"
    )
    transcript_segments = relationship(
        "TranscriptSegment", back_populates="meeting", cascade="all, delete-orphan",
        order_by="TranscriptSegment.sequence_order"
    )
    summary = relationship(
        "Summary", back_populates="meeting", uselist=False, cascade="all, delete-orphan"
    )
    action_items = relationship(
        "ActionItem", back_populates="meeting", cascade="all, delete-orphan"
    )
    chapters = relationship(
        "Chapter", back_populates="meeting", cascade="all, delete-orphan",
        order_by="Chapter.order_index"
    )


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    email = Column(String(300), nullable=True, unique=True)
    avatar_color = Column(String(20), default="#6366f1")

    meeting_participants = relationship("MeetingParticipant", back_populates="participant")


class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    participant_id = Column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="attendee")  # host, attendee

    meeting = relationship("Meeting", back_populates="meeting_participants")
    participant = relationship("Participant", back_populates="meeting_participants")


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    participant_id = Column(Integer, ForeignKey("participants.id", ondelete="SET NULL"), nullable=True)
    speaker_name = Column(String(200), nullable=False)
    start_time = Column(Float, nullable=False)  # seconds
    end_time = Column(Float, nullable=True)      # seconds
    text = Column(Text, nullable=False)
    sequence_order = Column(Integer, nullable=False, default=0)

    meeting = relationship("Meeting", back_populates="transcript_segments")
    participant = relationship("Participant")

    __table_args__ = (
        Index("ix_transcript_meeting_time", "meeting_id", "start_time"),
        Index("ix_transcript_meeting_order", "meeting_id", "sequence_order"),
    )


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, unique=True)
    overview = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="summary")
    key_topics = relationship(
        "KeyTopic", back_populates="summary", cascade="all, delete-orphan",
        order_by="KeyTopic.order_index"
    )


class KeyTopic(Base):
    __tablename__ = "key_topics"

    id = Column(Integer, primary_key=True, index=True)
    summary_id = Column(Integer, ForeignKey("summaries.id", ondelete="CASCADE"), nullable=False)
    topic = Column(String(500), nullable=False)
    order_index = Column(Integer, default=0)

    summary = relationship("Summary", back_populates="key_topics")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    assignee_name = Column(String(200), nullable=False)
    text = Column(Text, nullable=False)
    is_completed = Column(Boolean, default=False)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="action_items")

    __table_args__ = (
        Index("ix_action_items_meeting", "meeting_id"),
    )


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    start_time = Column(Float, nullable=False)  # seconds
    order_index = Column(Integer, default=0)

    meeting = relationship("Meeting", back_populates="chapters")
