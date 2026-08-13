"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import type { MeetingDetail, TranscriptSegment } from "@/types";
import * as api from "@/services/api";
import MeetingHeader from "@/components/meeting-detail/MeetingHeader";
import TranscriptPanel from "@/components/meeting-detail/TranscriptPanel";
import SummaryPanel from "@/components/meeting-detail/SummaryPanel";
import MediaPlayer from "@/components/meeting-detail/MediaPlayer";
import EditMeetingModal from "@/components/meetings/EditMeetingModal";
import DeleteConfirmModal from "@/components/meetings/DeleteConfirmModal";
import ToastContainer from "@/components/ui/ToastContainer";
import { useToast } from "@/hooks/useToast";

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const meetingId = Number(id);

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [loadingTranscript, setLoadingTranscript] = useState(true);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Player ↔ Transcript sync state
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);
  const seekFnRef = useRef<((time: number) => void) | null>(null);

  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const { toasts, addToast, removeToast } = useToast();

  // ── Load meeting detail ──
  const loadMeeting = useCallback(async () => {
    try {
      const m = await api.getMeeting(meetingId);
      setMeeting(m);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load meeting");
    } finally {
      setLoadingMeeting(false);
    }
  }, [meetingId]);

  // ── Load transcript ──
  const loadTranscript = useCallback(async () => {
    try {
      const segs = await api.getTranscript(meetingId);
      setTranscript(segs);
    } catch {
      // Transcript may not exist — that's fine
    } finally {
      setLoadingTranscript(false);
    }
  }, [meetingId]);

  useEffect(() => {
    loadMeeting();
    loadTranscript();
  }, [loadMeeting, loadTranscript]);

  // ── Player → Transcript: find active segment from current time ──
  useEffect(() => {
    if (transcript.length === 0) return;
    // Find the segment whose start_time <= currentTime < end_time (or next segment start)
    let active: TranscriptSegment | null = null;
    for (let i = transcript.length - 1; i >= 0; i--) {
      if (transcript[i].start_time <= currentTime) {
        active = transcript[i];
        break;
      }
    }
    setActiveSegmentId(active?.id ?? null);
  }, [currentTime, transcript]);

  // ── Transcript → Player: user clicks a segment ──
  const handleSegmentClick = useCallback((startTime: number, segmentId: number) => {
    setActiveSegmentId(segmentId);
    seekFnRef.current?.(startTime);
  }, []);

  // ── Chapter click seeks player ──
  const handleSeek = useCallback((time: number) => {
    seekFnRef.current?.(time);
  }, []);

  // ── Receive seek fn from MediaPlayer ──
  const handleSeekFnReady = useCallback((fn: (t: number) => void) => {
    seekFnRef.current = fn;
  }, []);

  // ── Edit ──
  const handleEdit = async (id: number, payload: Parameters<typeof api.updateMeeting>[1]) => {
    await api.updateMeeting(id, payload);
    addToast("Meeting updated", "success");
    loadMeeting();
  };

  // ── Delete ──
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.deleteMeeting(meetingId);
      addToast("Meeting deleted", "success");
      router.push("/meetings");
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : "Failed to delete meeting", "error");
      setDeleteLoading(false);
    }
  };

  // ── Action item refresh ──
  const handleActionItemUpdate = useCallback(() => {
    loadMeeting();
  }, [loadMeeting]);

  // ── Loading / error states ──
  if (loadingMeeting) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-5 animate-pulse transition-colors">
          <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded mb-3" />
          <div className="h-7 w-96 bg-gray-100 dark:bg-gray-800 rounded mb-3" />
          <div className="flex gap-4">
            <div className="h-4 w-28 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" />
            </svg>
            Loading meeting...
          </div>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-white dark:bg-gray-900 transition-colors">
        <div className="text-center">
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">Meeting not found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">{error || "This meeting doesn't exist or was deleted."}</p>
        </div>
        <button onClick={() => router.push("/meetings")}
          className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition">
          ← Back to Meetings
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900 transition-colors">
      {/* Header */}
      <MeetingHeader
        meeting={meeting}
        transcript={transcript}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      {/* Main two-column content */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-white dark:bg-gray-900 transition-colors">
        {/* Left: Transcript */}
        <div className={`flex-shrink-0 border-r border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col transition-all duration-300 ${isPanelCollapsed ? 'w-[calc(100%-60px)]' : 'w-[55%]'}`}>
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3h10M2 6h8M2 9h5" stroke="currentColor" className="text-violet-600 dark:text-violet-400" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <h2 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Transcript</h2>
            </div>
            <div className="flex items-center gap-3">
              {transcript.length > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-700">{transcript.length} segments</span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-hidden bg-gray-50/30 dark:bg-gray-900 transition-colors">
            <TranscriptPanel
              segments={transcript}
              loading={loadingTranscript}
              currentTime={currentTime}
              activeSegmentId={activeSegmentId}
              onSegmentClick={handleSegmentClick}
            />
          </div>
        </div>

        {/* Right: Summary / Action Items / Chapters */}
        <div className={`min-w-0 overflow-hidden flex flex-col transition-all duration-300 ${isPanelCollapsed ? 'w-[60px]' : 'flex-1'}`}>
          <div className="px-3 py-3 border-b border-gray-50 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-2 h-[45px] transition-colors">
            {!isPanelCollapsed && (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2h10v10H2z" stroke="currentColor" className="text-violet-600 dark:text-violet-400" strokeWidth="1.3" strokeLinejoin="round" />
                  <path d="M5 5h4M5 7.5h2" stroke="currentColor" className="text-violet-600 dark:text-violet-400" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <h2 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex-1">Smart Search</h2>
              </>
            )}
            <button 
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className={`flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isPanelCollapsed ? 'mx-auto' : ''}`}
              title={isPanelCollapsed ? "Expand Smart Panel" : "Collapse Panel"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-300 ${isPanelCollapsed ? 'rotate-180' : ''}`}>
                <path d="M19 12H5M12 19l7-7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 transition-colors">
            <SummaryPanel
              meeting={meeting}
              onActionItemUpdate={handleActionItemUpdate}
              onSeek={handleSeek}
              onToast={addToast}
              isCollapsed={isPanelCollapsed}
            />
          </div>
        </div>
      </div>

      {/* Bottom: Media Player */}
      <MediaPlayer
        duration={meeting.duration_seconds}
        onTimeUpdate={setCurrentTime}
        onSeek={handleSeekFnReady}
      />

      {/* Modals */}
      <EditMeetingModal
        open={editOpen}
        meeting={meeting}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
      />
      <DeleteConfirmModal
        open={deleteOpen}
        title={meeting.title}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
