"use client";
import { useState } from "react";
import type { MeetingListItem } from "@/types";
import { formatDate, formatRelativeDate, formatDurationLabel } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import Link from "next/link";

interface MeetingCardProps {
  meeting: MeetingListItem;
  onEdit: (meeting: MeetingListItem) => void;
  onDelete: (meeting: MeetingListItem) => void;
}

export default function MeetingCard({ meeting, onEdit, onDelete }: MeetingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-5 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 relative flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/meetings/${meeting.id}`}
          className="flex-1 min-w-0"
        >
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug hover:text-violet-700 dark:hover:text-violet-400 transition-colors line-clamp-2">
            {meeting.title}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatRelativeDate(meeting.date)} · {formatDate(meeting.date)}
          </p>
        </Link>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Meeting actions"
            id={`meeting-menu-${meeting.id}`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="3" r="1" fill="currentColor" />
              <circle cx="7" cy="7" r="1" fill="currentColor" />
              <circle cx="7" cy="11" r="1" fill="currentColor" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl w-40 py-1.5 animate-in fade-in-0 zoom-in-95 duration-100">
                <button
                  onClick={() => { onEdit(meeting); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 10.5L3.5 10l7-7a1 1 0 00-1.5-1.5l-7 7L2 10.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                  Edit meeting
                </button>
                <button
                  onClick={() => { onDelete(meeting); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 3.5h10M5.5 3.5V2.5h3V3.5M4.5 3.5l.5 8h4l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Participants */}
      {meeting.participants.length > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {meeting.participants.slice(0, 4).map((p) => (
              <Avatar key={p.id} name={p.name} color={p.avatar_color} size="xs" className="ring-2 ring-white dark:ring-gray-800" />
            ))}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {meeting.participants.length === 1
              ? meeting.participants[0].name
              : `${meeting.participants[0].name} +${meeting.participants.length - 1}`}
          </span>
        </div>
      )}

      {/* Meta stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {formatDurationLabel(meeting.duration_seconds)}
        </span>

        {meeting.transcript_count > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 3h8M2 6h6M2 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {meeting.transcript_count} segments
          </span>
        )}

        {meeting.action_item_count > 0 && (
          <span className="flex items-center gap-1 text-xs text-violet-500 dark:text-violet-400">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 6l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="1.5" y="1.5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            {meeting.action_item_count} action items
          </span>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/meetings/${meeting.id}`}
        className="mt-auto flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 3h8M2 6h6M2 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        View transcript & notes
      </Link>
    </div>
  );
}
