import { useState, useEffect, useRef } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';
import { Sparkles, Terminal, Volume2, VolumeX } from 'lucide-react';

interface WellnessState {
  current_mood: string;
  sleep_hours: number;
  stress_level: string;
}

interface AcademicState {
  current_subject: string;
  current_topic: string;
  mastered_topics: string[];
}

interface StudentState {
  wellness_state: WellnessState;
  academic_state: AcademicState;
}

interface Message {
  sender: 'user' | 'jarvis';
  text: string;
  timestamp: Date;
}

const DEFAULT_STATE: StudentState = {
  wellness_state: {
    current_mood: 'Neutral',
    sleep_hours: 7,
    stress_level: 'Medium',
  },
  academic_state: {
    current_subject: 'Physics',
    current_topic: 'Rotational Mechanics',
    mastered_topics: ['Electrostatics', 'Quadratic Equations'],
  },
};

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : '';

const loadLocalState = (): StudentState => {
  const saved = localStorage.getItem('jarvis_student_state');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    }
  }
  return DEFAULT_STATE;
};

const speakText = (text: string, onSpeechEnd?: () => void) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    // Clean emojis and markdown formatting
    const cleanText = text
      .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
      .replace(/\*|_|#/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    
    // Attempt to select a premium British voice for Jarvis
    const voice = voices.find(v => 
      v.name.includes('Google UK English Male') || 
      v.name.includes('Male') && v.lang.startsWith('en') ||
      v.name.includes('George') || 
      v.lang === 'en-GB'
    );
    if (voice) utterance.voice = voice;
    
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    if (onSpeechEnd) {
      utterance.onend = () => {
        onSpeechEnd();
      };
    }

    window.speechSynthesis.speak(utterance);
  }
};

function App() {
  const [state, setState] = useState<StudentState>(loadLocalState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voice mode states
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const isVoiceModeActiveRef = useRef(isVoiceModeActive);
  const isListeningRef = useRef(isListening);
  const isLoadingRef = useRef(isLoading);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    isVoiceModeActiveRef.current = isVoiceModeActive;
  }, [isVoiceModeActive]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          handleSendMessageRef.current(transcript.trim());
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        // If Voice Mode is active and we are NOT loading or speaking, restart listening!
        setTimeout(() => {
          if (
            isVoiceModeActiveRef.current && 
            !isListeningRef.current && 
            !isLoadingRef.current && 
            !window.speechSynthesis.speaking
          ) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.warn('Speech restart error:', e);
            }
          }
        }, 150);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Sync isMuted with isVoiceModeActive
  useEffect(() => {
    if (isMuted && isVoiceModeActive) {
      setIsVoiceModeActive(false);
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
    }
  }, [isMuted]);

  // Trigger speech synthesis when a new Jarvis message is received
  useEffect(() => {
    if (messages.length === 0 || isMuted) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === 'jarvis') {
      if (isVoiceModeActive) {
        speakText(lastMsg.text, () => {
          // On speech synthesis end callback: restart microphone if still active
          setTimeout(() => {
            if (isVoiceModeActiveRef.current && !isListeningRef.current && !isLoadingRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.warn('Speech restart end callback error:', e);
              }
            }
          }, 150);
        });
      } else {
        speakText(lastMsg.text);
      }
    }
  }, [messages, isMuted, isVoiceModeActive]);

  // Stop speaking if user mutes mid-sentence
  useEffect(() => {
    if (isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [isMuted]);

  const handleToggleVoiceMode = () => {
    if (!recognitionRef.current) {
      alert("Sir, Speech Recognition is not supported on this browser. I recommend Google Chrome.");
      return;
    }

    if (isVoiceModeActive) {
      setIsVoiceModeActive(false);
      setIsMuted(true);
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setIsVoiceModeActive(true);
      setIsMuted(false);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }
  };

  const updateStateAndPersist = (newState: StudentState) => {
    setState(newState);
    localStorage.setItem('jarvis_student_state', JSON.stringify(newState));
  };

  // Fetch initial state on load (sync with local file if running locally)
  useEffect(() => {
    const fetchState = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/state`);
        if (response.ok) {
          const data = await response.json();
          updateStateAndPersist(data);
        }
      } catch (err: any) {
        console.warn('Backend server connection offline or serverless. Operating on local cache:', err.message);
      }
    };

    fetchState();

    // Set initial J.A.R.V.I.S greeting
    setMessages([
      {
        sender: 'jarvis',
        text: "System initialized. Good day, Sir. I have loaded your JEE telemetry. Stress level is currently nominal, and I see you are focus-targeting Rotational Mechanics. How can I assist you with your studies or wellness today?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSendMessage = async (text: string) => {
    setIsLoading(true);
    setError(null);

    // Append user message
    const userMsg: Message = {
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, state }), // Send current state to backend
      });

      if (!response.ok) {
        throw new Error('Connection compiling error with Jarvis Core.');
      }

      const data = await response.json();

      // Append Jarvis response
      const jarvisMsg: Message = {
        sender: 'jarvis',
        text: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, jarvisMsg]);

      // Update HUD dashboard state and persist locally
      if (data.state) {
        updateStateAndPersist(data.state);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setError('Connection to J.A.R.V.I.S server failed. Please verify server status.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessageRef = useRef(handleSendMessage);
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  const handleResetState = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try resetting server state (local file fallback)
      await fetch(`${BACKEND_URL}/api/state/reset`, {
        method: 'POST',
      });
    } catch (err: any) {
      console.warn('Backend reset skipped (operating in serverless mode):', err.message);
    }

    // Reset frontend state regardless
    updateStateAndPersist(DEFAULT_STATE);
    setMessages([
      {
        sender: 'jarvis',
        text: "Telemetry reset complete, Sir. Sensors recalibrated to default baseline. Let us begin a fresh study log.",
        timestamp: new Date(),
      },
    ]);
    setIsLoading(false);
  };

  return (
    <div className="flex-grow flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full gap-6 hud-grid">
      {/* Top Navigation / Status Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between border border-hud-border/80 bg-hud-bg rounded-2xl px-6 py-4 glass-panel gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-jarvis-cyan/10 border border-jarvis-cyan/40 flex items-center justify-center text-jarvis-cyan shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse-slow">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold tracking-widest text-slate-100 uppercase">
              J.A.R.V.I.S // JEE CORE
            </h1>
            <p className="text-[10px] font-mono text-slate-400">
              MENTAL WELLNESS & SYLLABUS INTELLIGENCE
            </p>
          </div>
        </div>
        
        {/* Connection status indicator */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Mute/Unmute Jarvis Speech */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer ${
              !isMuted 
                ? 'border-jarvis-cyan/40 bg-jarvis-cyan/10 text-jarvis-cyan shadow-[0_0_10px_rgba(6,182,212,0.15)] animate-pulse'
                : 'border-hud-border bg-obsidian-panel/80 text-slate-400 hover:text-jarvis-cyan hover:border-jarvis-cyan/30'
            }`}
            title={isMuted ? "Unmute Jarvis Voice" : "Mute Jarvis Voice"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>VOICE: {isMuted ? 'MUTED' : 'ACTIVE'}</span>
          </button>

          <div className="flex items-center gap-2 border border-hud-border bg-obsidian-panel/80 px-3 py-1.5 rounded-lg text-slate-400">
            <Terminal className="w-3.5 h-3.5 text-jarvis-cyan" />
            <span>MODEL: GEMINI-2.5-FLASH</span>
          </div>
          <div className="flex items-center gap-2 border border-hud-border bg-obsidian-panel/80 px-3 py-1.5 rounded-lg text-slate-400">
            <span>SYS STATUS:</span>
            <span className="text-jarvis-emerald font-bold">ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main content viewport */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left column: Chat Terminal */}
        <section className="lg:col-span-7 h-full flex flex-col">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            error={error}
            isVoiceModeActive={isVoiceModeActive}
            isListening={isListening}
            onToggleVoiceMode={handleToggleVoiceMode}
          />
        </section>

        {/* Right column: HUD Dashboard */}
        <section className="lg:col-span-5 h-full flex flex-col">
          <Dashboard
            state={state}
            onReset={handleResetState}
            isLoading={isLoading}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
