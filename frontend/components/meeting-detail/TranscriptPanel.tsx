"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import type { TranscriptSegment } from "@/types";
import { secondsToTimestamp, highlightMatches, countMatches } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { TranscriptSkeleton } from "@/components/ui/Skeleton";

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  loading: boolean;
  currentTime: number;
  activeSegmentId: number | null;
  onSegmentClick: (startTime: number, segmentId: number) => void;
}

export default function TranscriptPanel({
  segments,
  loading,
  currentTime,
  activeSegmentId,
  onSegmentClick,
}: TranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Collect all matching segment indices
  const matchingSegments = searchQuery.trim()
    ? segments
        .map((seg, i) => ({ idx: i, count: countMatches(seg.text, searchQuery) }))
        .filter((m) => m.count > 0)
    : [];

  const totalMatches = matchingSegments.reduce((acc, m) => acc + m.count, 0);

  // Auto-scroll to active segment during playback
  useEffect(() => {
    if (activeSegmentId !== null && !searchQuery) {
      activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSegmentId, searchQuery]);

  // Scroll to match
  useEffect(() => {
    if (matchingSegments.length > 0 && searchQuery) {
      const target = matchingSegments[matchIndex % matchingSegments.length];
      const el = containerRef.current?.querySelector(`[data-seg="${target.idx}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [matchIndex, searchQuery, matchingSegments.length]);

  const handlePrevMatch = () => {
    setMatchIndex((prev) => (prev - 1 + matchingSegments.length) % matchingSegments.length);
  };

  const handleNextMatch = () => {
    setMatchIndex((prev) => (prev + 1) % matchingSegments.length);
  };

  // Speaker color map — keep consistent colors per speaker name
  const speakerColors = useCallback(() => {
    const colors = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#06b6d4"];
    const map: Record<string, string> = {};
    let idx = 0;
    segments.forEach((s) => {
      if (!(s.speaker_name in map)) {
        map[s.speaker_name] = colors[idx % colors.length];
        idx++;
      }
    });
    return map;
  }, [segments])();

  if (loading) return <TranscriptSkeleton />;

  return (
    <div className="flex flex-col h-full">      {/* Search bar — sticky */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 transition-colors">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setMatchIndex(0); }}
              placeholder="Search transcript..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-gray-800 transition-colors"
              id="transcript-search-input"
            />
          </div>

          {searchQuery && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 min-w-[60px] text-center">
                {totalMatches > 0 ? `${matchIndex + 1}/${matchingSegments.length}` : "No results"}
              </span>
              <button onClick={handlePrevMatch} disabled={matchingSegments.length === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 disabled:opacity-30 transition"
                id="transcript-search-prev" aria-label="Previous match">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M8 9.5L4.5 6 8 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button onClick={handleNextMatch} disabled={matchingSegments.length === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 disabled:opacity-30 transition"
                id="transcript-search-next" aria-label="Next match">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4 2.5L7.5 6 4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button onClick={() => { setSearchQuery(""); setMatchIndex(0); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition"
                id="transcript-search-clear" aria-label="Clear search">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {searchQuery && totalMatches > 0 && (
          <p className="text-[11px] text-gray-400 mt-1.5 px-1">
            {totalMatches} match{totalMatches !== 1 ? "es" : ""} across {matchingSegments.length} segment{matchingSegments.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Transcript segments */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {segments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 5h18M3 9h14M3 13h10M3 17h7" stroke="currentColor" className="text-gray-300 dark:text-gray-600" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 font-medium">No transcript available</p>
            <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">This meeting doesn't have a transcript yet</p>
          </div>
        )}

        {segments.map((seg, i) => {
          const isActive = activeSegmentId === seg.id;
          const isMatchSegment = searchQuery
            ? matchingSegments.some((m) => m.idx === i)
            : false;
          const currentMatchSegIdx = matchingSegments[matchIndex % matchingSegments.length]?.idx;
          const isCurrentMatch = searchQuery ? currentMatchSegIdx === i : false;

          return (
            <div
              key={seg.id}
              ref={isActive ? activeRef : null}
              data-seg={i}
              onClick={() => onSegmentClick(seg.start_time, seg.id)}
              className={`group flex gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 ${
                isActive
                  ? "bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20"
                  : isCurrentMatch
                  ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20"
                  : isMatchSegment
                  ? "bg-amber-50/50 dark:bg-amber-500/5"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
              }`}
            >
              {/* Timestamp */}
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onSegmentClick(seg.start_time, seg.id); }}
                  className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded transition-colors ${
                    isActive ? "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/20" : "text-gray-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 group-hover:bg-violet-50 dark:group-hover:bg-violet-500/10"
                  }`}
                  title={`Seek to ${secondsToTimestamp(seg.start_time)}`}
                >
                  {secondsToTimestamp(seg.start_time)}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Speaker */}
                <div className="flex items-center gap-1.5 mb-1">
                  <Avatar
                    name={seg.speaker_name}
                    color={speakerColors[seg.speaker_name] ?? "#6366f1"}
                    size="xs"
                  />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{seg.speaker_name}</span>
                </div>

                {/* Text with highlights */}
                <p
                  className={`text-sm leading-relaxed ${isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}
                  dangerouslySetInnerHTML={{
                    __html: searchQuery
                      ? highlightMatches(seg.text, searchQuery)
                      : seg.text.replace(/&/g, "&amp;").replace(/</g, "&lt;"),
                  }}
                />
              </div>

              {/* Play icon on hover */}
              <div className={`flex-shrink-0 pt-0.5 transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isActive ? "bg-violet-100 dark:bg-violet-500/20" : "bg-gray-100 dark:bg-gray-800"}`}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M2 1.5l4 2.5-4 2.5V1.5z" fill="currentColor" className={isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-400"} />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
