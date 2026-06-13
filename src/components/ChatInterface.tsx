import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, User, AlertCircle } from 'lucide-react';

interface Message {
  sender: 'user' | 'jarvis';
  text: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  error
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const suggestionChips = [
    "I only slept 4 hours last night and I am studying Physics.",
    "Jarvis, I am feeling extremely stressed and overwhelmed.",
    "I have finally completed and mastered Electrostatics!",
    "Suggest a lighter revision plan for Chemistry."
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-[600px] md:h-full relative overflow-hidden">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-hud-border pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-jarvis-cyan animate-pulse-slow" />
          <h2 className="text-sm font-semibold tracking-widest text-slate-300">
            J.A.R.V.I.S // NEURAL CORE v4.5
          </h2>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-jarvis-emerald">
          <span className="w-2 h-2 rounded-full bg-jarvis-emerald animate-ping" />
          ONLINE
        </span>
      </div>

      {/* Message History */}
      <div className="flex-grow overflow-y-auto mb-4 space-y-4 pr-2 text-left">
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={index}
              className={`flex gap-3 max-w-[85%] ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                  isUser
                    ? 'border-jarvis-cyan/30 bg-jarvis-cyan/10 text-jarvis-cyan'
                    : 'border-hud-border bg-obsidian-panel/60 text-slate-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4 text-jarvis-cyan" />}
              </div>

              <div className="flex flex-col gap-1">
                <div
                  className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed border transition-all duration-300 ${
                    isUser
                      ? 'bg-jarvis-cyan/5 border-jarvis-cyan/20 text-slate-100 shadow-[0_0_12px_rgba(6,182,212,0.03)]'
                      : 'bg-obsidian-panel/40 border-hud-border/60 text-slate-300'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] font-mono text-slate-500 px-1 self-start">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-hud-border bg-obsidian-panel/60 text-slate-400">
              <Cpu className="w-4 h-4 text-jarvis-cyan animate-spin" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="rounded-xl px-4 py-2.5 text-sm bg-obsidian-panel/40 border border-hud-border/40 text-slate-400 flex items-center gap-2">
                <span className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-jarvis-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-jarvis-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-jarvis-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                <span className="text-xs font-mono text-slate-500">Compiling telemetry...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-2 items-center bg-jarvis-rose/10 border border-jarvis-rose/20 text-jarvis-rose text-xs rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 1 && !isLoading && (
        <div className="mb-4 text-left">
          <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block mb-2">
            Suggested Queries:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (!isLoading) {
                    onSendMessage(chip);
                  }
                }}
                className="text-[11px] text-left text-slate-400 hover:text-jarvis-cyan bg-obsidian-panel/40 hover:bg-jarvis-cyan/5 border border-hud-border hover:border-jarvis-cyan/30 rounded-lg p-2 transition-all duration-300 cursor-pointer truncate"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Input */}
      <form onSubmit={handleSubmit} className="relative mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Sir, instruct me on your wellness or syllabus updates..."
          className="w-full bg-obsidian-panel/70 border border-hud-border rounded-xl pl-4 pr-12 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-jarvis-cyan/50 focus:ring-1 focus:ring-jarvis-cyan/30 transition-all duration-300 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-jarvis-cyan/10 hover:bg-jarvis-cyan/25 border border-jarvis-cyan/30 hover:border-jarvis-cyan/60 flex items-center justify-center text-jarvis-cyan transition-all duration-300 disabled:opacity-40 disabled:hover:bg-jarvis-cyan/10 disabled:hover:border-jarvis-cyan/30 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
