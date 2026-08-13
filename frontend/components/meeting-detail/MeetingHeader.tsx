"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { MeetingDetail, TranscriptSegment } from "@/types";
import { formatDate, formatDurationLabel } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { downloadMeetingAs } from "@/lib/export";

interface MeetingHeaderProps {
  meeting: MeetingDetail;
  transcript: TranscriptSegment[];
  onEdit: () => void;
  onDelete: () => void;
}

export default function MeetingHeader({ meeting, transcript, onEdit, onDelete }: MeetingHeaderProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between gap-6 transition-colors">
      {/* Left: Title & Meta */}
      <div className="flex-1 min-w-0 flex items-start gap-3">
        <Link 
          href="/meetings" 
          className="mt-1 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          title="Back to meetings"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3.5L5.5 8 10 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight truncate">{meeting.title}</h1>
          
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {formatDate(meeting.date)}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDurationLabel(meeting.duration_seconds)}
            </span>
            
            {meeting.participants.length > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {meeting.participants.slice(0, 3).map((p) => (
                      <Avatar key={p.id} name={p.name} color={p.avatar_color} size="xs" className="ring-2 ring-white dark:ring-gray-900" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {meeting.participants.length} Participants
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Summary Toolbar */}
      <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-100 dark:border-gray-800 flex-shrink-0">
        
        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm hover:text-gray-900 dark:hover:text-gray-200 transition-all"
            title="Export Meeting"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8m0 0l-3-3m3 3l3-3M3 13h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export
          </button>
          
          {exportOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
              <div className="py-1">
                <button
                  onClick={() => { window.print(); setExportOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Save as PDF
                </button>
                <button
                  onClick={() => { downloadMeetingAs("md", meeting, transcript); setExportOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Markdown (.md)
                </button>
                <button
                  onClick={() => { downloadMeetingAs("txt", meeting, transcript); setExportOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Text (.txt)
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm hover:text-red-600 dark:hover:text-red-400 transition-all"
          title="Delete Meeting"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M5.5 3.5V2.5h3V3.5M4.5 3.5l.5 8h4l.5-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
