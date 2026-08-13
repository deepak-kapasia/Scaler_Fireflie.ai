"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { MeetingCreatePayload, ParticipantInput } from "@/types";

interface CreateMeetingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: MeetingCreatePayload) => Promise<void>;
}

const AVATAR_COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#06b6d4","#84cc16","#f97316"];

export default function CreateMeetingModal({ open, onClose, onSubmit }: CreateMeetingModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [durationHours, setDurationHours] = useState(0);
  const [durationMins, setDurationMins] = useState(30);
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<ParticipantInput[]>([]);
  const [transcriptText, setTranscriptText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setTitle(""); setDate(new Date().toISOString().slice(0, 16));
    setDurationHours(0); setDurationMins(30);
    setParticipantInput(""); setParticipants([]);
    setTranscriptText(""); setLoading(false); setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const addParticipant = () => {
    const name = participantInput.trim();
    if (!name) return;
    if (participants.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setParticipantInput(""); return;
    }
    const color = AVATAR_COLORS[participants.length % AVATAR_COLORS.length];
    setParticipants((prev) => [...prev, { name, avatar_color: color, role: participants.length === 0 ? "host" : "attendee" }]);
    setParticipantInput("");
  };

  const removeParticipant = (name: string) => {
    setParticipants((prev) => prev.filter((p) => p.name !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setLoading(true); setError("");
    try {
      await onSubmit({
        title: title.trim(),
        date: new Date(date).toISOString(),
        duration_seconds: durationHours * 3600 + durationMins * 60,
        participants,
        transcript_text: transcriptText || undefined,
      });
      reset(); onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="New Meeting" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Meeting Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q3 Product Planning"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-500 transition"
            autoFocus
            id="create-meeting-title"
          />
        </div>

        {/* Date & Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Date & Time</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-500 transition"
              id="create-meeting-date"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Duration</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-500 transition"
                  id="create-meeting-hours"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">h</span>
              </div>
              <div className="relative flex-1">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-500 transition"
                  id="create-meeting-mins"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Participants</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={participantInput}
              onChange={(e) => setParticipantInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addParticipant(); } }}
              placeholder="Enter name and press Enter"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-500 transition"
              id="create-meeting-participant"
            />
            <button
              type="button"
              onClick={addParticipant}
              className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              Add
            </button>
          </div>
          {participants.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {participants.map((p) => (
                <span
                  key={p.name}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: p.avatar_color }}
                >
                  {p.name}
                  {p.role === "host" && <span className="opacity-75">(host)</span>}
                  <button type="button" onClick={() => removeParticipant(p.name)} className="opacity-75 hover:opacity-100 ml-0.5">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Transcript text */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            Transcript <span className="font-normal text-gray-400 dark:text-gray-500">(optional — paste plain text or VTT)</span>
          </label>
          <textarea
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            placeholder="Paste transcript text here, or leave blank..."
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-500 transition resize-none font-mono"
            id="create-meeting-transcript"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            id="create-meeting-submit"
          >
            {loading ? "Creating..." : "Create Meeting"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
