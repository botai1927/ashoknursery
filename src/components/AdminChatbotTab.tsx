import { RefObject } from 'react';
import {
  Bot,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
  Loader2,
  Send,
} from 'lucide-react';
import type { AdminAiStatusSnapshot, AiModelChoice, AiProviderChoice } from './AdminApiTab';
import type { AdminTab } from './adminConstants';

export interface ChatMessageAction {
  type:
    | 'delete_plant'
    | 'open_diagnostics'
    | 'run_bug_fix'
    | 'open_trash'
    | 'add_plant'
    | 'open_cloudinary'
    | 'open_api'
    | 'edit_plant';
  labelBn: string;
  plantId?: string;
  plantName?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  providerUsed?: string;
  sources?: Array<{ title: string; uri: string }>;
  action?: ChatMessageAction;
}

interface AdminChatbotTabProps {
  isAdminSimpleView: boolean;
  aiStatus: AdminAiStatusSnapshot | null;
  aiProviderChoice?: AiProviderChoice;
  setAiProviderChoice?: (p: AiProviderChoice) => void;
  modelType: AiModelChoice;
  setModelType: (m: AiModelChoice) => void;
  useSearchGrounding: boolean;
  setUseSearchGrounding: (v: boolean) => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  isChatLoading: boolean;
  chatScrollRef: RefObject<HTMLDivElement | null>;
  onSendMessage: (textToSend?: string) => void;
  onExecuteAction: (action: ChatMessageAction) => void;
  onSwitchTab: (tab: AdminTab) => void;
  onOpenDiagnostics: () => void;
  onRunBugFix: () => void;
  isRunningBugFix?: boolean;
  rootCauseCount: number;
  trashedCount: number;
}

export function AdminChatbotTab({
  isAdminSimpleView,
  aiStatus,
  modelType,
  setModelType,
  useSearchGrounding,
  setUseSearchGrounding,
  chatMessages,
  chatInput,
  setChatInput,
  isChatLoading,
  chatScrollRef,
  onSendMessage,
  onExecuteAction,
  onSwitchTab,
  onOpenDiagnostics,
  onRunBugFix,
  isRunningBugFix = false,
  rootCauseCount,
  trashedCount,
}: AdminChatbotTabProps) {
  return (
    <div className="h-[calc(100dvh-11.5rem)] lg:h-[calc(100dvh-8rem)] min-h-[440px] max-h-[820px] flex flex-col bg-white border border-[#E8E1D5] rounded-2xl overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-2.5 bg-[#FBF9F5] border-b border-[#E8E1D5] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-[#142318]">
          <Bot className="w-4 h-4 text-[#1B8354]" />
          <span className={isAdminSimpleView ? 'text-sm sm:text-base' : ''}>Gemini AI পরামর্শক</span>
          {aiStatus && (
            <button
              type="button"
              onClick={() => onSwitchTab('api')}
              className={`text-xs font-semibold cursor-pointer hover:underline tabular-nums ${
                aiStatus.activeSlotCooldownSec > 0 ? 'text-[#B34728]' : 'text-[#1B8354]'
              }`}
            >
              {aiStatus.activeSlotCooldownSec > 0
                ? `বিরতি (${aiStatus.activeSlotCooldownSec}s)`
                : `${aiStatus.activeSlotId?.toUpperCase() || 'KEY'} সক্রিয় · Gemini`}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            aria-label="Select Gemini AI Model"
            value={modelType}
            onChange={(e) => setModelType(e.target.value as AiModelChoice)}
            className="h-8 px-2 bg-white border border-[#D5C9B8] rounded-lg font-bold text-[#142318] text-xs"
          >
            <option value="auto">Auto (Gemini Cascade)</option>
            <option value="flash25">Gemini 2.5 Flash</option>
            <option value="fast">Gemini 3.1 Flash Lite</option>
            <option value="hydrogen">Gemini 4 Hydrogen</option>
          </select>

          <label className="flex items-center gap-1 cursor-pointer text-xs text-[#526356] pl-1">
            <input
              type="checkbox"
              checked={useSearchGrounding}
              onChange={(e) => setUseSearchGrounding(e.target.checked)}
              className="rounded text-[#1B8354]"
            />
            <span>Search</span>
          </label>
        </div>
      </div>

      {/* Quick Prompt Toolbar */}
      <div className="px-3 py-2 bg-[#F5EFE6] border-b border-[#E8E1D5] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() =>
            onSendMessage('বাঁকুড়ার আবহাওয়ায় গাছের পাতায় পোকা বা ছত্রাক লাগলে ঘরোয়া ও সহজ প্রতিকার কী?')
          }
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1B8354] text-white text-xs font-bold hover:bg-[#146c44] transition-colors shrink-0 cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#A3E635]" />
          <span>গাছের রোগ ও প্রতিকার</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onSendMessage('হোয়াটসঅ্যাপে কাস্টমারকে আমাদের সুস্থ চারার অফার ও যত্নের নিয়ম সুন্দর বাংলায় লিখে দিন।')
          }
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#142318] text-white text-xs font-bold hover:bg-[#203425] transition-colors shrink-0 cursor-pointer whitespace-nowrap"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#A3E635]" />
          <span>কাস্টমার মেসেজ লিখুন</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onSendMessage('আমার ক্যাটালগ ও অ্যাপে কোথায় কী সমস্যা হচ্ছে, তার মূল কারণ কী এবং কীভাবে সমাধান করবো?')
          }
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#B34728] text-white text-xs font-bold hover:bg-[#8F351D] transition-colors shrink-0 cursor-pointer whitespace-nowrap"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>সমস্যা ও মূল কারণ</span>
        </button>

        <button
          type="button"
          onClick={onOpenDiagnostics}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#D5C9B8] text-xs font-bold text-[#142318] hover:bg-[#FAF8F5] transition-colors shrink-0 cursor-pointer whitespace-nowrap"
        >
          <Search className="w-3.5 h-3.5 text-[#1B8354]" />
          <span className="tabular-nums">অডিট কেন্দ্র ({rootCauseCount})</span>
        </button>

        <button
          type="button"
          disabled={isRunningBugFix}
          onClick={onRunBugFix}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#1B8354] text-xs font-bold text-[#1B8354] hover:bg-[#F0FDF4] disabled:opacity-60 transition-colors shrink-0 cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunningBugFix ? 'animate-spin' : ''}`} />
          <span>{isRunningBugFix ? 'মেরামত চলছে...' : 'বাগ ফিক্স'}</span>
        </button>

        <button
          type="button"
          onClick={() => onSwitchTab('trash')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#D5C9B8] text-xs font-bold text-[#B34728] hover:bg-[#FAF8F5] transition-colors shrink-0 cursor-pointer whitespace-nowrap"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="tabular-nums">ট্র্যাশ বিন ({trashedCount})</span>
        </button>
      </div>

      {/* Thread */}
      <div
        ref={chatScrollRef}
        className={`flex-1 overflow-y-auto p-4 space-y-3 font-sans-bn ${
          isAdminSimpleView ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
        }`}
      >
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#142318] text-white rounded-tr-xs'
                  : 'bg-[#FBF9F5] border border-[#E8E1D5] text-[#142318] rounded-tl-xs'
              }`}
            >
              <p>{msg.text}</p>

              {msg.action && (
                <div className="mt-2.5 pt-2 border-t border-[#E8E1D5]">
                  <button
                    type="button"
                    disabled={msg.action.type === 'run_bug_fix' && isRunningBugFix}
                    onClick={() => msg.action && onExecuteAction(msg.action)}
                    className="w-full py-2 px-3 bg-[#1B8354] hover:bg-[#146c44] disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {msg.action.type === 'run_bug_fix' && isRunningBugFix ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A3E635]" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#A3E635]" />
                    )}
                    <span>
                      {msg.action.type === 'run_bug_fix' && isRunningBugFix
                        ? 'স্বয়ংক্রিয় বাগ ফিক্স চলছে...'
                        : msg.action.labelBn}
                    </span>
                  </button>
                </div>
              )}

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#E8E1D5] space-y-1">
                  <p className="text-xs font-bold text-[#785942]">তথ্যসূত্র:</p>
                  <div className="flex flex-wrap gap-1">
                    {msg.sources.slice(0, 3).map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-[#D5C9B8] text-xs text-[#1B8354]"
                      >
                        <span className="truncate max-w-[140px]">{src.title || 'Source'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <span className="block text-xs text-right mt-1 opacity-60 tabular-nums">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isChatLoading && (
          <div className="flex gap-2 items-center text-xs text-[#785942] italic">
            <Loader2 className="w-4 h-4 animate-spin text-[#1B8354]" />
            <span>উত্তর তৈরি হচ্ছে...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-[#E8E1D5] flex items-center gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSendMessage();
          }}
          placeholder="চারার দাম, নতুন জাত বা রোগবালাই নিয়ে লিখুন..."
          className="flex-1 h-11 px-3.5 border border-[#D5C9B8] rounded-xl text-base sm:text-sm text-[#142318] focus:outline-2 focus:outline-[#1B8354] focus:outline-offset-1 focus:border-[#1B8354]"
        />
        <button
          type="button"
          disabled={isChatLoading || !chatInput.trim()}
          onClick={() => onSendMessage()}
          className="h-11 px-4 bg-[#1B8354] hover:bg-[#146c44] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <span>পাঠান</span>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
