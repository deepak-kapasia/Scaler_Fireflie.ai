"use client";
import { useState } from "react";
import * as api from "@/services/api";
import type { MeetingListItem } from "@/types";
import { formatDate, formatDurationLabel } from "@/lib/utils";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MeetingListItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.getMeetings({ search: query.trim(), page_size: 50 });
      setResults(res.items);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 transition-colors">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Search</h1>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1 max-w-xl">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search meetings by title, topic, or keyword..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-gray-800 transition-colors"
              id="global-search-input" autoFocus />
          </div>
          <button type="submit" disabled={loading}
            className="px-5 py-3 rounded-2xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50"
            id="global-search-submit">
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 bg-white dark:bg-gray-900 transition-colors">
        {!searched ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-20">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/10 flex items-center justify-center mb-4 transition-colors">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" className="text-violet-600 dark:text-violet-400" strokeWidth="1.8" />
                <path d="M19 19l5 5" stroke="currentColor" className="text-violet-600 dark:text-violet-400" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">Search your meetings</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">Find meetings by title, participant, or keywords discussed.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 font-medium">No results for "{query}"</p>
            <p className="text-xs text-gray-400 mt-1">Try different keywords or check your spelling.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            <p className="text-sm text-gray-400 mb-4">{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"</p>
            {results.map((m) => (
              <Link key={m.id} href={`/meetings/${m.id}`}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl hover:border-violet-200 dark:hover:border-gray-600 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/10 flex items-center justify-center flex-shrink-0 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 4.5h12M3 8h9M3 11.5h6" stroke="currentColor" className="text-violet-600 dark:text-violet-400" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">{m.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(m.date)} · {formatDurationLabel(m.duration_seconds)} · {m.participants.map(p => p.name).join(", ")}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-300 dark:text-gray-600 group-hover:text-violet-400 dark:group-hover:text-violet-500 transition-colors flex-shrink-0">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
