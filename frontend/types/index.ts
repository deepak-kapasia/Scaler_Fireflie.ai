// ──────────────────────────────────────────────
// Core Types
// ──────────────────────────────────────────────

export interface Participant {
  id: number;
  name: string;
  email?: string | null;
  avatar_color: string;
}

export interface KeyTopic {
  id: number;
  summary_id: number;
  topic: string;
  order_index: number;
}

export interface Summary {
  id: number;
  meeting_id: number;
  overview: string;
  key_topics: KeyTopic[];
  created_at: string;
  updated_at: string;
}

export interface ActionItem {
  id: number;
  meeting_id: number;
  assignee_name: string;
  text: string;
  is_completed: boolean;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: number;
  meeting_id: number;
  title: string;
  start_time: number; // seconds
  order_index: number;
}

export interface TranscriptSegment {
  id: number;
  meeting_id: number;
  participant_id?: number | null;
  speaker_name: string;
  start_time: number; // seconds
  end_time?: number | null;
  text: string;
  sequence_order: number;
}

export interface MeetingListItem {
  id: number;
  title: string;
  date: string;
  duration_seconds: number;
  recording_url?: string | null;
  participants: Participant[];
  action_item_count: number;
  transcript_count: number;
  created_at: string;
}

export interface MeetingDetail extends MeetingListItem {
  summary?: Summary | null;
  action_items: ActionItem[];
  chapters: Chapter[];
  updated_at: string;
}

export interface MeetingListResponse {
  items: MeetingListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ──────────────────────────────────────────────
// Request Payloads
// ──────────────────────────────────────────────

export interface ParticipantInput {
  name: string;
  email?: string;
  avatar_color?: string;
  role?: string;
}

export interface MeetingCreatePayload {
  title: string;
  date: string;
  duration_seconds: number;
  recording_url?: string;
  participants?: ParticipantInput[];
  transcript_text?: string;
}

export interface MeetingUpdatePayload {
  title?: string;
  date?: string;
  duration_seconds?: number;
  recording_url?: string;
  participants?: ParticipantInput[];
}

export interface ActionItemCreatePayload {
  assignee_name: string;
  text: string;
  is_completed?: boolean;
  due_date?: string;
}

export interface ActionItemUpdatePayload {
  assignee_name?: string;
  text?: string;
  is_completed?: boolean;
  due_date?: string;
}

export interface SummaryCreatePayload {
  overview: string;
  key_topics?: { topic: string; order_index: number }[];
}

export interface TranscriptBulkPayload {
  segments: {
    speaker_name: string;
    start_time: number;
    end_time?: number;
    text: string;
    sequence_order: number;
  }[];
  replace?: boolean;
}

// ──────────────────────────────────────────────
// UI State
// ──────────────────────────────────────────────

export interface MeetingFilters {
  search: string;
  participant: string;
  from_date: string;
  to_date: string;
  sort: "newest" | "oldest";
}

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}
