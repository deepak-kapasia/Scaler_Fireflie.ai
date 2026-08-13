/**
 * API service layer — all HTTP calls to the FastAPI backend.
 * Never call fetch() directly from components; use these functions.
 */
import type {
  MeetingListResponse,
  MeetingListItem,
  MeetingDetail,
  TranscriptSegment,
  Summary,
  ActionItem,
  Chapter,
  Participant,
  MeetingCreatePayload,
  MeetingUpdatePayload,
  ActionItemCreatePayload,
  ActionItemUpdatePayload,
  SummaryCreatePayload,
  TranscriptBulkPayload,
  MeetingFilters,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ──────────────────────────────────────────────
// Meetings
// ──────────────────────────────────────────────

export function getMeetings(filters?: Partial<MeetingFilters> & { page?: number; page_size?: number }): Promise<MeetingListResponse> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.participant) params.set("participant", filters.participant);
  if (filters?.from_date) params.set("from_date", filters.from_date);
  if (filters?.to_date) params.set("to_date", filters.to_date);
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.page_size) params.set("page_size", String(filters.page_size));
  const qs = params.toString();
  return request<MeetingListResponse>(`/meetings${qs ? `?${qs}` : ""}`);
}

export function getMeeting(id: number): Promise<MeetingDetail> {
  return request<MeetingDetail>(`/meetings/${id}`);
}

export function createMeeting(payload: MeetingCreatePayload): Promise<MeetingListItem> {
  return request<MeetingListItem>("/meetings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMeeting(id: number, payload: MeetingUpdatePayload): Promise<MeetingListItem> {
  return request<MeetingListItem>(`/meetings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteMeeting(id: number): Promise<void> {
  return request<void>(`/meetings/${id}`, { method: "DELETE" });
}

// ──────────────────────────────────────────────
// Transcript
// ──────────────────────────────────────────────

export function getTranscript(meetingId: number): Promise<TranscriptSegment[]> {
  return request<TranscriptSegment[]>(`/meetings/${meetingId}/transcript`);
}

export function uploadTranscript(meetingId: number, payload: TranscriptBulkPayload): Promise<TranscriptSegment[]> {
  return request<TranscriptSegment[]>(`/meetings/${meetingId}/transcript`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ──────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────

export function getSummary(meetingId: number): Promise<Summary> {
  return request<Summary>(`/meetings/${meetingId}/summary`);
}

export function upsertSummary(meetingId: number, payload: SummaryCreatePayload): Promise<Summary> {
  return request<Summary>(`/meetings/${meetingId}/summary`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ──────────────────────────────────────────────
// Action Items
// ──────────────────────────────────────────────

export function getActionItems(meetingId: number): Promise<ActionItem[]> {
  return request<ActionItem[]>(`/meetings/${meetingId}/action-items`);
}

export function createActionItem(meetingId: number, payload: ActionItemCreatePayload): Promise<ActionItem> {
  return request<ActionItem>(`/meetings/${meetingId}/action-items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateActionItem(id: number, payload: ActionItemUpdatePayload): Promise<ActionItem> {
  return request<ActionItem>(`/action-items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteActionItem(id: number): Promise<void> {
  return request<void>(`/action-items/${id}`, { method: "DELETE" });
}

// ──────────────────────────────────────────────
// Chapters
// ──────────────────────────────────────────────

export function getChapters(meetingId: number): Promise<Chapter[]> {
  return request<Chapter[]>(`/meetings/${meetingId}/chapters`);
}

// ──────────────────────────────────────────────
// Participants
// ──────────────────────────────────────────────

export function getParticipants(): Promise<Participant[]> {
  return request<Participant[]>("/participants");
}
