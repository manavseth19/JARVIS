import React from 'react';
import { Brain, Moon, BookOpen, CheckCircle, Zap, Activity, Shield } from 'lucide-react';

interface WellnessState {
  current_mood: string;
  sleep_hours: number;
  stress_level: 'Low' | 'Medium' | 'High' | string;
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

interface DashboardProps {
  state: StudentState;
  onReset: () => void;
  isLoading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onReset, isLoading }) => {
  const { wellness_state, academic_state } = state;
  
  // Sleep progress bar configuration
  const sleepMax = 10;
  const sleepPercentage = Math.min((wellness_state.sleep_hours / sleepMax) * 100, 100);
  const isSleepCriticallyLow = wellness_state.sleep_hours < 6;

  // Stress indicator coloring
  const getStressColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-jarvis-emerald border-jarvis-emerald/30 bg-jarvis-emerald/10';
      case 'high': return 'text-jarvis-rose border-jarvis-rose/30 bg-jarvis-rose/10';
      case 'medium':
      default:
        return 'text-jarvis-amber border-jarvis-amber/30 bg-jarvis-amber/10';
    }
  };

  const getStressLevelBarCount = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 1;
      case 'high': return 3;
      case 'medium':
      default:
        return 2;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full gap-6 relative overflow-hidden">
      {/* HUD Scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-jarvis-cyan/5 to-transparent h-1/2 pointer-events-none animate-hud-scan" />

      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-hud-border pb-4 z-10">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-jarvis-cyan animate-pulse" />
          <h2 className="text-sm font-semibold tracking-widest text-jarvis-cyan text-glow-cyan">
            J.A.R.V.I.S // TELEMETRY HUD
          </h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={isLoading}
          className="text-xs px-3 py-1.5 rounded-lg border border-hud-border hover:border-jarvis-cyan/40 hover:bg-jarvis-cyan/10 transition-all duration-300 text-slate-400 hover:text-jarvis-cyan flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Shield className="w-3.5 h-3.5" />
          Reset System State
        </button>
      </div>

      {/* Main Grid telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 z-10">
        {/* Wellness Gauge: Sleep */}
        <div className="border border-hud-border/60 bg-obsidian-panel/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-jarvis-blue" />
              Sleep Telemetry
            </span>
            <span className={`text-xs font-mono font-bold ${isSleepCriticallyLow ? 'text-jarvis-rose text-glow-rose' : 'text-jarvis-cyan'}`}>
              {wellness_state.sleep_hours} Hrs
            </span>
          </div>

          <div className="w-full bg-slate-800/40 rounded-full h-2.5 mb-3 overflow-hidden border border-hud-border/20">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isSleepCriticallyLow ? 'bg-gradient-to-r from-rose-600 to-jarvis-rose' : 'bg-gradient-to-r from-blue-600 to-jarvis-cyan'
              }`}
              style={{ width: `${sleepPercentage}%` }}
            />
          </div>

          {isSleepCriticallyLow ? (
            <div className="bg-jarvis-rose/10 border border-jarvis-rose/20 rounded-lg p-2.5 text-left">
              <span className="text-[10px] font-bold text-jarvis-rose uppercase tracking-wider block mb-0.5 animate-pulse">
                CRITICAL WARNING: SLEEP DEPRIVED
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                JEE cognitive function decreases by up to 40%. Jarvis recommends a study suspension.
              </p>
            </div>
          ) : (
            <div className="bg-jarvis-cyan/5 border border-hud-border/40 rounded-lg p-2.5 text-left">
              <span className="text-[10px] font-bold text-jarvis-cyan uppercase tracking-wider block mb-0.5">
                SLEEP SUFFICIENT
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sir, your sleep cycle is adequate to maintain focus and solve complex physics modules.
              </p>
            </div>
          )}
        </div>

        {/* Wellness Gauge: Stress & Mood */}
        <div className="border border-hud-border/60 bg-obsidian-panel/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-jarvis-cyan" />
              Mental Wellness
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${getStressColor(wellness_state.stress_level)}`}>
              STRESS: {wellness_state.stress_level}
            </span>
          </div>

          {/* Stress level bars */}
          <div className="flex gap-1.5 mb-3">
            {[1, 2, 3].map((bar) => {
              const activeCount = getStressLevelBarCount(wellness_state.stress_level);
              const isActive = bar <= activeCount;
              let barColor = 'bg-slate-800/40';
              if (isActive) {
                if (activeCount === 1) barColor = 'bg-jarvis-emerald shadow-[0_0_8px_rgba(16,185,129,0.4)]';
                else if (activeCount === 2) barColor = 'bg-jarvis-amber shadow-[0_0_8px_rgba(245,158,11,0.4)]';
                else barColor = 'bg-jarvis-rose shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse';
              }
              return (
                <div key={bar} className={`h-2 flex-1 rounded-sm transition-all duration-500 ${barColor}`} />
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-auto bg-slate-900/30 border border-hud-border/20 rounded-lg p-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-jarvis-amber" />
              Extracted Mood:
            </span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {wellness_state.current_mood}
            </span>
          </div>
        </div>
      </div>

      {/* Academic Status Card */}
      <div className="border border-hud-border/60 bg-obsidian-panel/40 rounded-xl p-4 flex flex-col gap-3 z-10 text-left">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-jarvis-cyan" />
          Active JEE Tracker
        </span>

        <div className="grid grid-cols-2 gap-4 border-t border-hud-border/30 pt-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject</span>
            <span className="text-sm font-semibold text-slate-200">{academic_state.current_subject}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Focus Module</span>
            <span className="text-sm font-semibold text-jarvis-cyan text-glow-cyan truncate block">
              {academic_state.current_topic}
            </span>
          </div>
        </div>
      </div>

      {/* Mastered Modules Badge list */}
      <div className="border border-hud-border/60 bg-obsidian-panel/40 rounded-xl p-4 flex flex-col gap-3 flex-grow z-10 text-left min-h-[140px]">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-jarvis-emerald" />
          Mastered JEE Syllabus ({academic_state.mastered_topics.length})
        </span>

        <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[120px] pr-1 mt-1">
          {academic_state.mastered_topics.length > 0 ? (
            academic_state.mastered_topics.map((topic, index) => (
              <span
                key={index}
                className="text-[11px] font-mono font-semibold text-jarvis-emerald bg-jarvis-emerald/10 border border-jarvis-emerald/25 px-2.5 py-1 rounded-md shadow-[0_0_6px_rgba(16,185,129,0.05)] transition-all duration-300 hover:border-jarvis-emerald/50"
              >
                ✓ {topic}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 italic">
              No JEE modules added yet. Tell Jarvis when you complete a topic.
            </span>
          )}
        </div>
      </div>
      
      {/* Simulation Box for grading and feedback */}
      <div className="text-[10px] font-mono text-slate-500 text-center mt-auto border-t border-hud-border/20 pt-3 flex justify-between">
        <span>JARVIS V4.5 // SYSTEM RUNNING</span>
        <span>PORT 5000 // DETERMINISTIC</span>
      </div>
    </div>
  );
};
