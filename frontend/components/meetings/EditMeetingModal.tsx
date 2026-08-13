"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import type { MeetingListItem, MeetingUpdatePayload, ParticipantInput } from "@/types";

interface EditMeetingModalProps {
  open: boolean;
  meeting: MeetingListItem | null;
  onClose: () => void;
  onSubmit: (id: number, payload: MeetingUpdatePayload) => Promise<void>;
}

const AVATAR_COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#06b6d4","#84cc16","#f97316"];

export default function EditMeetingModal({ open, meeting, onClose, onSubmit }: EditMeetingModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [durationHours, setDurationHours] = useState(0);
  const [durationMins, setDurationMins] = useState(30);
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<ParticipantInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title);
      const d = new Date(meeting.date);
      setDate(d.toISOString().slice(0, 16));
      setDurationHours(Math.floor(meeting.duration_seconds / 3600));
      setDurationMins(Math.floor((meeting.duration_seconds % 3600) / 60));
      setParticipants(meeting.participants.map((p, i) => ({
        name: p.name,
        email: p.email ?? undefined,
        avatar_color: p.avatar_color,
        role: i === 0 ? "host" : "attendee",
      })));
    }
  }, [meeting]);

  const addParticipant = () => {
    const name = participantInput.trim();
    if (!name) return;
    if (participants.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setParticipantInput(""); return;
    }
    const color = AVATAR_COLORS[participants.length % AVATAR_COLORS.length];
    setParticipants((prev) => [...prev, { name, avatar_color: color, role: "attendee" }]);
    setParticipantInput("");
  };

  const removeParticipant = (name: string) => {
    setParticipants((prev) => prev.filter((p) => p.name !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting || !title.trim()) { setError("Title is required"); return; }
    setLoading(true); setError("");
    try {
      await onSubmit(meeting.id, {
        title: title.trim(),
        date: new Date(date).toISOString(),
        duration_seconds: durationHours * 3600 + durationMins * 60,
        participants,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Meeting" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Meeting Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-500 transition"
            autoFocus
            id="edit-meeting-title"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Date & Time</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-500 transition"
              id="edit-meeting-date"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Duration</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="number" min={0} max={8} value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-500 transition"
                  id="edit-meeting-hours"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">h</span>
              </div>
              <div className="relative flex-1">
                <input type="number" min={0} max={59} value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-500 transition"
                  id="edit-meeting-mins"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">m</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Participants</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={participantInput}
              onChange={(e) => setParticipantInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addParticipant(); }}}
              placeholder="Add participant name..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-500 transition"
              id="edit-meeting-participant"
            />
            <button type="button" onClick={addParticipant}
              className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              Add
            </button>
          </div>
          {participants.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {participants.map((p) => (
                <span key={p.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: p.avatar_color }}>
                  {p.name}
                  <button type="button" onClick={() => removeParticipant(p.name)} className="opacity-75 hover:opacity-100">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50"
            id="edit-meeting-submit">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
