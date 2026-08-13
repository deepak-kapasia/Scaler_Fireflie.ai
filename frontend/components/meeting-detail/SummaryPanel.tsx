"use client";
import { useState } from "react";
import type { MeetingDetail, ActionItem, Chapter, Summary } from "@/types";
import { secondsToTimestamp } from "@/lib/utils";
import * as api from "@/services/api";

interface SummaryPanelProps {
  meeting: MeetingDetail;
  onActionItemUpdate: () => void;
  onSeek: (time: number) => void;
  onToast: (msg: string, variant: "success" | "error" | "info") => void;
  isCollapsed?: boolean;
}

type Tab = "summary" | "actions" | "chapters";

export default function SummaryPanel({ meeting, onActionItemUpdate, onSeek, onToast, isCollapsed }: SummaryPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [newItemText, setNewItemText] = useState("");
  const [newItemAssignee, setNewItemAssignee] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const summary: Summary | null = meeting.summary ?? null;
  const actionItems: ActionItem[] = meeting.action_items ?? [];
  const chapters: Chapter[] = meeting.chapters ?? [];

  const handleToggleActionItem = async (item: ActionItem) => {
    try {
      await api.updateActionItem(item.id, { is_completed: !item.is_completed });
      onActionItemUpdate();
    } catch {
      onToast("Failed to update action item", "error");
    }
  };

  const handleDeleteActionItem = async (id: number) => {
    setDeletingId(id);
    try {
      await api.deleteActionItem(id);
      onActionItemUpdate();
      onToast("Action item deleted", "success");
    } catch {
      onToast("Failed to delete action item", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddActionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !newItemAssignee.trim()) return;
    setAddingItem(true);
    try {
      await api.createActionItem(meeting.id, {
        assignee_name: newItemAssignee.trim(),
        text: newItemText.trim(),
        is_completed: false,
      });
      setNewItemText("");
      setNewItemAssignee("");
      setShowAddForm(false);
      onActionItemUpdate();
      onToast("Action item added", "success");
    } catch {
      onToast("Failed to add action item", "error");
    } finally {
      setAddingItem(false);
    }
  };

  const completedCount = actionItems.filter((a) => a.is_completed).length;

  const tabs: { id: Tab; label: string; count?: number; icon: React.ReactNode }[] = [
    { 
      id: "summary", 
      label: "Summary",
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h10M2 7h8M2 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    },
    { 
      id: "actions", 
      label: "Actions", 
      count: actionItems.length,
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    },
    { 
      id: "chapters", 
      label: "Chapters", 
      count: chapters.length,
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" /><path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    },
  ];

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-4 gap-3 bg-gray-50/50 dark:bg-gray-800/20 h-full border-l border-gray-100 dark:border-gray-800 transition-colors">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === tab.id
                ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 shadow-sm ring-1 ring-violet-200 dark:ring-violet-500/30"
                : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50"
            }`}
            title={tab.label}
          >
            {tab.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors">
      {/* Tabs */}
      <div className="px-4 py-3 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-10 border-b border-gray-50 dark:border-gray-800">
        <div className="flex gap-2 bg-gray-50/80 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-100/50 dark:border-gray-700/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
              }`}
              id={`summary-tab-${tab.id}`}
            >
              <span className={activeTab === tab.id ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-gray-500"}>{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold leading-none ${
                  activeTab === tab.id ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

        {/* ── SUMMARY TAB ── */}
        {activeTab === "summary" && (
          <>
            {!summary ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12h6M9 16h4M7 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8l-5-5H7z" stroke="currentColor" className="text-gray-300 dark:text-gray-600" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400 font-medium">No summary yet</p>
              </div>
            ) : (
              <>
                {/* Overview */}
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-100 dark:border-violet-800/50 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 3h10M1 6h8M1 9h6" stroke="currentColor" className="text-violet-700 dark:text-violet-400" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">Overview</h3>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary.overview}</p>
                </div>

                {/* Key Topics */}
                {summary.key_topics.length > 0 && (
                  <div className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <circle cx="6" cy="6" r="4.5" stroke="currentColor" className="text-emerald-500" strokeWidth="1.2" />
                          <path d="M4 6l1.5 1.5L8 4" stroke="currentColor" className="text-emerald-500" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Key Topics</h3>
                    </div>
                    <ul className="space-y-2">
                      {summary.key_topics.map((kt) => (
                        <li key={kt.id} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-2" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{kt.topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── ACTION ITEMS TAB ── */}
        {activeTab === "actions" && (
          <>
            {/* Progress bar */}
            {actionItems.length > 0 && (
              <div className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Progress</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{completedCount}/{actionItems.length} completed</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${actionItems.length > 0 ? (completedCount / actionItems.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action items list */}
            <div className="space-y-2">
              {actionItems.map((item) => (
                <div key={item.id}
                  className={`group flex items-start gap-3 p-4 rounded-xl border transition-all ${
                    item.is_completed ? "bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800" : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleActionItem(item)}
                    className={`mt-0.5 w-4.5 h-4.5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                      item.is_completed
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-300 dark:border-gray-600 hover:border-violet-400 dark:hover:border-violet-500"
                    }`}
                    aria-label={item.is_completed ? "Mark incomplete" : "Mark complete"}
                    style={{ width: 18, height: 18 }}
                    id={`action-item-toggle-${item.id}`}
                  >
                    {item.is_completed && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${item.is_completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}>
                      {item.text}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">{item.assignee_name}</p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteActionItem(item.id)}
                    disabled={deletingId === item.id}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
                    aria-label="Delete action item"
                    id={`action-item-delete-${item.id}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 3h8M4.5 3V2h3V3M4 3l.4 6h3.2L8 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}

              {actionItems.length === 0 && !showAddForm && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">No action items yet</p>
                </div>
              )}
            </div>

            {/* Add action item */}
            {showAddForm ? (
              <form onSubmit={handleAddActionItem} className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/50 rounded-xl p-4 space-y-3">
                <input
                  type="text"
                  value={newItemAssignee}
                  onChange={(e) => setNewItemAssignee(e.target.value)}
                  placeholder="Assignee name..."
                  className="w-full px-3 py-2 rounded-lg border border-violet-200 dark:border-violet-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-500/50 bg-white dark:bg-gray-900"
                  autoFocus
                  id="action-item-assignee"
                />
                <textarea
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Action item description..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-violet-200 dark:border-violet-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-500/50 bg-white dark:bg-gray-900 resize-none"
                  id="action-item-text"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={addingItem}
                    className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50"
                    id="action-item-submit">
                    {addingItem ? "Adding..." : "Add"}
                  </button>
                  <button type="button" onClick={() => { setShowAddForm(false); setNewItemText(""); setNewItemAssignee(""); }}
                    className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                id="add-action-item-btn"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Add action item
              </button>
            )}
          </>
        )}

        {/* ── CHAPTERS TAB ── */}
        {activeTab === "chapters" && (
          <>
            {chapters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No chapters for this meeting</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => onSeek(ch.start_time)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-500/10 group transition-all text-left"
                    id={`chapter-${ch.id}`}
                  >
                    {/* Chapter number */}
                    <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400 group-hover:text-violet-700 dark:group-hover:text-violet-400 flex-shrink-0 transition-colors">
                      {idx + 1}
                    </span>

                    {/* Title */}
                    <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
                      {ch.title}
                    </span>

                    {/* Timestamp */}
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors flex-shrink-0">
                      {secondsToTimestamp(ch.start_time)}
                    </span>

                    {/* Play icon */}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <path d="M3 2l7 4-7 4V2z" fill="currentColor" className="text-violet-600 dark:text-violet-400" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
