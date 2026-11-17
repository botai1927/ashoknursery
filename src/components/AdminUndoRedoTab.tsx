import { useState } from 'react';
import { Undo2, Redo2, History } from 'lucide-react';
import type { AdminUndoRecord } from '../utils/adminUndoRedoStorage';

interface AdminUndoRedoTabProps {
  undoStack: AdminUndoRecord[];
  redoStack: AdminUndoRecord[];
  onUndo: () => void;
  onRedo: () => void;
  isAdminSimpleView: boolean;
}

export function AdminUndoRedoTab({
  undoStack,
  redoStack,
  onUndo,
  onRedo,
  isAdminSimpleView,
}: AdminUndoRedoTabProps) {
  const [activeSegment, setActiveSegment] = useState<'undo' | 'redo'>('undo');

  return (
    <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D5] flex-wrap gap-3">
        <div>
          <h2 className={`font-serif-bn font-bold text-[#142318] ${isAdminSimpleView ? 'text-xl' : 'text-base sm:text-lg'}`}>
            ↩️ ক্যাটালগ আনডু ও রিডু হিস্ট্রি (Undo & Redo Management)
          </h2>
          <p className={isAdminSimpleView ? 'text-sm text-[#526356]' : 'text-xs text-[#785942]'}>
            এখানে আপনার প্রতিটি ক্যাটালগ পরিবর্তন, দাম বদল, চারা যোগ বা ট্র্যাশ মুছলে তার বিস্তারিত ইতিহাস সংরক্ষিত থাকে।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={undoStack.length === 0}
            onClick={onUndo}
            className="px-4 py-2 bg-[#1B8354] hover:bg-[#146c44] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Undo2 className="w-4 h-4 text-[#A3E635]" />
            <span>সর্বশেষ আনডু করুন ({undoStack.length})</span>
          </button>

          <button
            type="button"
            disabled={redoStack.length === 0}
            onClick={onRedo}
            className="px-4 py-2 bg-[#142318] hover:bg-[#203425] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Redo2 className="w-4 h-4 text-[#A3E635]" />
            <span>সর্বশেষ রিডু করুন ({redoStack.length})</span>
          </button>
        </div>
      </div>

      {/* Segment Switcher */}
      <div className="flex rounded-xl bg-[#FAF8F5] p-1 border border-[#E8E1D5]">
        <button
          type="button"
          onClick={() => setActiveSegment('undo')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSegment === 'undo'
              ? 'bg-[#142318] text-white shadow-xs'
              : 'text-[#526356] hover:text-[#142318]'
          }`}
        >
          <Undo2 className="w-4 h-4 text-[#A3E635]" />
          <span>আনডু করার মতো পরিবর্তন (Undo Stack: {undoStack.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSegment('redo')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSegment === 'redo'
              ? 'bg-[#142318] text-white shadow-xs'
              : 'text-[#526356] hover:text-[#142318]'
          }`}
        >
          <Redo2 className="w-4 h-4 text-[#A3E635]" />
          <span>রিডু করার মতো পরিবর্তন (Redo Stack: {redoStack.length})</span>
        </button>
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {activeSegment === 'undo' ? (
          undoStack.length === 0 ? (
            <div className="py-12 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#D5C9B8] space-y-2">
              <History className="w-8 h-8 text-[#785942] mx-auto opacity-60" />
              <p className="text-sm font-bold text-[#142318]">আনডু করার মতো কোনো সাম্প্রতিক পরিবর্তন নেই</p>
              <p className="text-xs text-[#785942]">
                গাছ যোগ, দাম পরিবর্তন বা এডিট করলে এখানে বিস্তারিত তালিকা দেখতে পাবেন।
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {undoStack.slice().reverse().map((item, idx) => (
                <div
                  key={item.id || `undo-${idx}`}
                  className="p-3.5 bg-white border border-[#E8E1D5] hover:border-[#1B8354] rounded-xl flex items-center justify-between gap-3 transition-all shadow-2xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#EBF5EF] text-[#1B8354] flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs font-bold">
                      #{undoStack.length - idx}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#166534] text-xs font-bold uppercase">
                          {item.type}
                        </span>
                        <span className="text-xs text-[#785942] font-mono tabular-nums">
                          {item.timestampBn || 'সদ্য সংরক্ষিত'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-[#142318] truncate">
                        {item.labelBn}
                      </p>
                    </div>
                  </div>

                  {idx === 0 && (
                    <button
                      type="button"
                      onClick={onUndo}
                      className="px-3 py-1.5 bg-[#1B8354] hover:bg-[#146c44] text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
                    >
                      এটি আনডু করুন
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          redoStack.length === 0 ? (
            <div className="py-12 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#D5C9B8] space-y-2">
              <History className="w-8 h-8 text-[#785942] mx-auto opacity-60" />
              <p className="text-sm font-bold text-[#142318]">রিডু করার মতো কোনো পরিবর্তন নেই</p>
              <p className="text-xs text-[#785942]">
                আনডু করার পর সেই পরিবর্তনটি পুনরায় কার্যকর করতে চাইলে এখানে তালিকা থাকবে।
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {redoStack.slice().reverse().map((item, idx) => (
                <div
                  key={item.id || `redo-${idx}`}
                  className="p-3.5 bg-white border border-[#E8E1D5] hover:border-[#142318] rounded-xl flex items-center justify-between gap-3 transition-all shadow-2xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] text-[#785942] flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs font-bold">
                      #{redoStack.length - idx}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-xs font-bold uppercase">
                          {item.type}
                        </span>
                        <span className="text-xs text-[#785942] font-mono tabular-nums">
                          {item.timestampBn || 'সদ্য সংরক্ষিত'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-[#142318] truncate">
                        {item.labelBn}
                      </p>
                    </div>
                  </div>

                  {idx === 0 && (
                    <button
                      type="button"
                      onClick={onRedo}
                      className="px-3 py-1.5 bg-[#142318] hover:bg-[#203425] text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
                    >
                      এটি রিডু করুন
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
