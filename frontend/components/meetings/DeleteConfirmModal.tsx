"use client";
import Modal from "@/components/ui/Modal";

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export default function DeleteConfirmModal({ open, title, onClose, onConfirm, loading }: DeleteConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Meeting" size="sm">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 8v4M10 14h.01M3.5 17h13a1.5 1.5 0 001.3-2.25L11.3 4.25a1.5 1.5 0 00-2.6 0L2.2 14.75A1.5 1.5 0 003.5 17z"
                stroke="currentColor" className="text-red-500 dark:text-red-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Delete this meeting?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              <span className="font-medium text-gray-700 dark:text-gray-300">"{title}"</span> and all its transcript, summary, and action items will be permanently removed. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            id="delete-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50"
            id="delete-confirm"
          >
            {loading ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
