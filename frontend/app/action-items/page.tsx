"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import * as api from "@/services/api";
import type { MeetingListItem, ActionItem } from "@/types";
import { formatDate } from "@/lib/utils";

interface ActionItemWithMeeting extends ActionItem {
  meeting: MeetingListItem;
}

export default function ActionItemsPage() {
  const [items, setItems] = useState<ActionItemWithMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const meetings = await api.getMeetings({ page_size: 100 });
        const allItems: ActionItemWithMeeting[] = [];
        await Promise.all(
          meetings.items.map(async (m) => {
            const ais = await api.getActionItems(m.id);
            ais.forEach((ai) => allItems.push({ ...ai, meeting: m }));
          })
        );
        allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setItems(allItems);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggle = async (item: ActionItemWithMeeting) => {
    await api.updateActionItem(item.id, { is_completed: !item.is_completed });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_completed: !i.is_completed } : i));
  };

  const pending = items.filter((i) => !i.is_completed);
  const completed = items.filter((i) => i.is_completed);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 transition-colors">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Action Items</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          {pending.length} pending · {completed.length} completed
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">No action items yet. They appear here when added from meeting notes.</p>
          </div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pending ({pending.length})</h2>
                <div className="space-y-2">
                  {pending.map((item) => (
                    <ActionItemRow key={item.id} item={item} onToggle={handleToggle} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Completed ({completed.length})</h2>
                <div className="space-y-2">
                  {completed.map((item) => (
                    <ActionItemRow key={item.id} item={item} onToggle={handleToggle} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ActionItemRow({ item, onToggle }: { item: ActionItemWithMeeting; onToggle: (item: ActionItemWithMeeting) => void }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
      item.is_completed ? "bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800" : "bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
    }`}>
      <button onClick={() => onToggle(item)}
        className={`mt-0.5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
          item.is_completed ? "bg-emerald-500 border-emerald-500" : "border-gray-300 dark:border-gray-600 hover:border-violet-400 dark:hover:border-violet-500"
        }`}
        style={{ width: 18, height: 18 }}>
        {item.is_completed && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${item.is_completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}>{item.text}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{item.assignee_name}</span>
          <span className="text-gray-200 dark:text-gray-700">·</span>
          <Link href={`/meetings/${item.meeting.id}`}
            className="text-xs text-violet-500 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 truncate max-w-[200px] transition-colors">
            {item.meeting.title}
          </Link>
          <span className="text-gray-200 dark:text-gray-700">·</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.meeting.date)}</span>
        </div>
      </div>
    </div>
  );
}
