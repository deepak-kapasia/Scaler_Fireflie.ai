"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { MeetingListItem, MeetingListResponse, MeetingFilters } from "@/types";
import * as api from "@/services/api";
import { debounce } from "@/lib/utils";
import MeetingCard from "@/components/meetings/MeetingCard";
import CreateMeetingModal from "@/components/meetings/CreateMeetingModal";
import EditMeetingModal from "@/components/meetings/EditMeetingModal";
import DeleteConfirmModal from "@/components/meetings/DeleteConfirmModal";
import ToastContainer from "@/components/ui/ToastContainer";
import { MeetingCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/useToast";

const DEFAULT_FILTERS: MeetingFilters = {
  search: "",
  participant: "",
  from_date: "",
  to_date: "",
  sort: "newest",
};

export default function MeetingsPage() {
  const [data, setData] = useState<MeetingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<MeetingFilters>(DEFAULT_FILTERS);
  const [liveSearch, setLiveSearch] = useState(""); // for immediate input
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<MeetingListItem | null>(null);
  const [deleteMeeting, setDeleteMeeting] = useState<MeetingListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toasts, addToast, removeToast } = useToast();

  // Debounced search update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearch = useCallback(
    debounce((val: string) => {
      setFilters((f) => ({ ...f, search: val }));
      setPage(1);
    }, 350),
    []
  );

  const handleSearchChange = (val: string) => {
    setLiveSearch(val);
    debouncedSetSearch(val);
  };

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.getMeetings({ ...filters, page, page_size: 20 });
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  // ── CRUD handlers ──
  const handleCreate = async (payload: Parameters<typeof api.createMeeting>[0]) => {
    await api.createMeeting(payload);
    addToast("Meeting created successfully", "success");
    loadMeetings();
  };

  const handleEdit = async (id: number, payload: Parameters<typeof api.updateMeeting>[1]) => {
    await api.updateMeeting(id, payload);
    addToast("Meeting updated successfully", "success");
    loadMeetings();
  };

  const handleDelete = async () => {
    if (!deleteMeeting) return;
    setDeleteLoading(true);
    try {
      await api.deleteMeeting(deleteMeeting.id);
      addToast("Meeting deleted", "success");
      setDeleteMeeting(null);
      loadMeetings();
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : "Failed to delete meeting", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setLiveSearch("");
    setPage(1);
  };

  const hasActiveFilters = filters.participant || filters.from_date || filters.to_date || filters.search;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900 transition-colors">
      {/* Top Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Meetings</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {data ? `${data.total} meeting${data.total !== 1 ? "s" : ""}` : "Loading..."}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 active:scale-95 transition-all shadow-sm"
          id="create-meeting-btn"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New Meeting
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center gap-3 flex-shrink-0 flex-wrap transition-colors">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={liveSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search meetings..."
            className="w-full pl-9 pr-9 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-gray-800 transition-colors"
            id="meetings-search"
          />
          {liveSearch && (
            <button onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Participant filter */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1.5 11c0-2.5 2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={filters.participant}
            onChange={(e) => { setFilters((f) => ({ ...f, participant: e.target.value })); setPage(1); }}
            placeholder="Filter by participant"
            className="pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-gray-800 transition-colors w-44"
            id="meetings-filter-participant"
          />
        </div>

        {/* Date from */}
        <input
          type="date"
          value={filters.from_date}
          onChange={(e) => { setFilters((f) => ({ ...f, from_date: e.target.value })); setPage(1); }}
          className="py-2 px-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-gray-800 transition-colors"
          id="meetings-filter-from"
          title="From date"
        />

        {/* Date to */}
        <input
          type="date"
          value={filters.to_date}
          onChange={(e) => { setFilters((f) => ({ ...f, to_date: e.target.value })); setPage(1); }}
          className="py-2 px-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-gray-800 transition-colors"
          id="meetings-filter-to"
          title="To date"
        />

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={(e) => { setFilters((f) => ({ ...f, sort: e.target.value as "newest" | "oldest" })); setPage(1); }}
          className="py-2 px-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-gray-800 transition-colors cursor-pointer"
          id="meetings-sort"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            id="meetings-clear-filters">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50/30 dark:bg-gray-900 transition-colors">
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl text-sm text-red-600 dark:text-red-400 mb-6">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 5v3M8 10h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {error}
            <button onClick={loadMeetings} className="ml-auto text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <MeetingCardSkeleton key={i} />)}
          </div>
        ) : data?.items.length === 0 ? (
          <EmptyState
            title={hasActiveFilters ? "No meetings match your filters" : "No meetings yet"}
            description={hasActiveFilters ? "Try adjusting your search or filter criteria." : "Create your first meeting to get started."}
            icon={
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M4 8h24M4 14h16M4 20h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
            action={
              !hasActiveFilters ? (
                <button onClick={() => setCreateOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition">
                  Create first meeting
                </button>
              ) : (
                <button onClick={clearFilters}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-sm font-medium text-gray-600 hover:bg-gray-200 transition">
                  Clear filters
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data?.items.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onEdit={setEditMeeting}
                  onDelete={setDeleteMeeting}
                />
              ))}
            </div>

            {/* Pagination */}
            {data && data.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition">
                  ← Prev
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400 px-2">Page {page} of {data.total_pages}</span>
                <button onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages}
                  className="px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreateMeetingModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} />
      <EditMeetingModal open={!!editMeeting} meeting={editMeeting} onClose={() => setEditMeeting(null)} onSubmit={handleEdit} />
      <DeleteConfirmModal
        open={!!deleteMeeting}
        title={deleteMeeting?.title ?? ""}
        onClose={() => setDeleteMeeting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
