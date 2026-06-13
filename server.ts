import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const STATE_FILE_PATH = path.join(__dirname, 'data', 'state.json');

const DEFAULT_STATE = {
  wellness_state: {
    current_mood: "Neutral",
    sleep_hours: 7,
    stress_level: "Medium"
  },
  academic_state: {
    current_subject: "Physics",
    current_topic: "Rotational Mechanics",
    mastered_topics: [
      "Electrostatics",
      "Quadratic Equations"
    ]
  }
};

// Helper to read state
function readState() {
  try {
    if (!fs.existsSync(STATE_FILE_PATH)) {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(STATE_FILE_PATH), { recursive: true });
      fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(DEFAULT_STATE, null, 2));
      return DEFAULT_STATE;
    }
    const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading state file:', error);
    return DEFAULT_STATE;
  }
}

// Helper to write state
function writeState(state: typeof DEFAULT_STATE) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE_PATH), { recursive: true });
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error writing state file:', error);
  }
}

// Check if API key is configured
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('WARNING: GEMINI_API_KEY is not set in environment variables. Running in Mock Mode.');
}

// Initialize Gemini client (fallback if apiKey is empty)
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Heuristic fallback state extraction in case of API rate limits
function fallbackExtract(message: string, currentState: any) {
  const updates: any = {};
  const lowerMsg = message.toLowerCase();

  // Sleep regex: e.g. "slept 4 hours", "4 hours of sleep", "sleep: 5 hours", "only 6 hours", "slept 5"
  const sleepMatch = lowerMsg.match(/(?:sleep|slept|sleeping|rested)\s*(?:for)?\s*(\d+(?:\.\d+)?)/) || 
                     lowerMsg.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)s?\s*(?:of)?\s*(?:sleep)/);
  if (sleepMatch) {
    const hours = parseFloat(sleepMatch[1]);
    if (!isNaN(hours)) {
      updates.sleep_hours = hours;
    }
  }

  // Mood detection: e.g. tired, stressed, happy, excited, overwhelmed, motivated, anxious, exhausted
  const moods = ['tired', 'stressed', 'happy', 'excited', 'overwhelmed', 'motivated', 'anxious', 'exhausted', 'sad', 'neutral', 'focused'];
  for (const m of moods) {
    if (lowerMsg.includes(m)) {
      updates.current_mood = m.charAt(0).toUpperCase() + m.slice(1);
      break;
    }
  }

  // Stress level inference
  if (lowerMsg.includes('overwhelmed') || lowerMsg.includes('exhausted') || lowerMsg.includes('very stressed') || lowerMsg.includes('burnout')) {
    updates.stress_level = 'High';
  } else if (lowerMsg.includes('stress') || lowerMsg.includes('anxious') || lowerMsg.includes('tired')) {
    updates.stress_level = 'Medium';
  } else if (lowerMsg.includes('fine') || lowerMsg.includes('happy') || lowerMsg.includes('good') || lowerMsg.includes('relaxed')) {
    updates.stress_level = 'Low';
  }

  // Subject detection: Physics, Chemistry, Math/Mathematics
  if (lowerMsg.includes('physics')) {
    updates.current_subject = 'Physics';
  } else if (lowerMsg.includes('chemistry')) {
    updates.current_subject = 'Chemistry';
  } else if (lowerMsg.includes('math') || lowerMsg.includes('algebra') || lowerMsg.includes('calculus')) {
    updates.current_subject = 'Mathematics';
  }

  // Mastered topics detection: completed X, mastered Y, finished Z
  const masterMatch = lowerMsg.match(/(?:mastered|completed|finished|cracked)\s+([a-z0-9\s]+?)(?:today|\.|$|!)/);
  if (masterMatch) {
    const topic = masterMatch[1].trim();
    if (topic.length > 2 && topic.length < 40) {
      updates.mastered_topic_to_add = topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  // Topic detection: e.g. "studying X", "working on Y"
  const topicMatch = lowerMsg.match(/(?:studying|working on|topic is|focusing on)\s+([a-z0-9\s]+?)(?:today|\.|$|!)/);
  if (topicMatch) {
    const topic = topicMatch[1].trim();
    if (topic.length > 2 && topic.length < 40) {
      updates.current_topic = topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  return updates;
}

// In-character fallback response when Gemini hits a quota rate limit
function generateFallbackResponse(state: any, message: string, originalError: any) {
  console.warn("Generating J.A.R.V.I.S fallback response due to API error:", originalError.message);
  
  const wellness = state.wellness_state;
  const academic = state.academic_state;
  
  let reply = `Sir, my remote connection to the Google GenAI mainframe is temporarily restricted due to quota limits. However, I have successfully updated your local HUD state.\n\n`;
  
  if (wellness.sleep_hours < 6) {
    reply += `⚠️ CRITICAL WELLNESS ALERT: I notice you have logged only ${wellness.sleep_hours} hours of sleep. Sir, preparing for JEE on sleep deprivation is highly counterproductive. I strongly recommend suspending your study of ${academic.current_topic} and getting at least 7-8 hours of rest immediately.`;
  } else if (wellness.stress_level === 'High') {
    reply += `Sir, your current stress telemetry is registered as High. Please take a 10-minute break. I suggest stepping away from ${academic.current_subject} to engage in light breathing exercises before returning to ${academic.current_topic}.`;
  } else {
    reply += `Your telemetry shows you are focusing on ${academic.current_subject} (${academic.current_topic}). Your sleep is sufficient (${wellness.sleep_hours} hrs) and stress is ${wellness.stress_level.toLowerCase()}. I suggest proceeding with your planned study schedule with caution.`;
  }
  
  return reply;
}

// Endpoint: GET /api/state
app.get('/api/state', (req, res) => {
  const state = readState();
  res.json(state);
});

// Endpoint: POST /api/state/reset
app.post('/api/state/reset', (req, res) => {
  writeState(DEFAULT_STATE);
  res.json({ message: 'State reset successful', state: DEFAULT_STATE });
});

// Endpoint: POST /api/chat
app.post('/api/chat', async (req, res) => {
  const { message, state } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const currentState = state || readState();

  // If no Gemini client, run Mock Jarvis
  if (!ai) {
    const responseText = `[Jarvis - Demo Mode (API Key Missing)]: Sir, please set your GEMINI_API_KEY in the .env file. Mocking response for: "${message}". Current topic: ${currentState.academic_state.current_topic}. Sleep: ${currentState.wellness_state.sleep_hours} hours.`;
    return res.json({ response: responseText, state: currentState });
  }

  // --- COMBINED AI PROCESS (ONE STEP) ---
  let updates: any = {};
  let reply = '';
  
  try {
    const combinedPrompt = `
      You are J.A.R.V.I.S., the highly sophisticated, witty, and empathetic AI wellness companion and academic mentor for a student preparing for the Indian IIT JEE exam.
      Adopt the sleek, British, caring tone of Tony Stark's personal assistant. Refer to the student as "Sir" or "Ma'am" (default to "Sir").

      You have access to the student's current recorded state:
      ${JSON.stringify(currentState, null, 2)}

      Analyze the student's message: "${message}"

      You must perform two tasks:
      1. Extract updates for any student state fields that are mentioned or strongly implied:
         - current_mood: e.g. Tired, Stressed, Motivated, Excited, Overwhelmed.
         - sleep_hours: number of hours of sleep (number).
         - stress_level: Low, Medium, or High.
         - current_subject: e.g. Physics, Chemistry, Mathematics.
         - current_topic: the specific JEE topic.
         - mastered_topic_to_add: topic completed or mastered.
         - mastered_topic_to_remove: topic to study again.
         (If a field is not mentioned or implied, do not return it in the updates object).

      2. Generate an empathetic, witty J.A.R.V.I.S dialogue response. Reference their current study topic and subject. If sleep is low (< 6 hours), you MUST prioritize advising them to rest and warn them of cognitive performance drops on hard JEE physics/math modules. Keep the response under 4 sentences.

      You must return your output in JSON format matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: combinedPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            updates: {
              type: 'OBJECT',
              properties: {
                current_mood: { type: 'STRING' },
                sleep_hours: { type: 'NUMBER' },
                stress_level: { type: 'STRING', enum: ['Low', 'Medium', 'High'] },
                current_subject: { type: 'STRING' },
                current_topic: { type: 'STRING' },
                mastered_topic_to_add: { type: 'STRING' },
                mastered_topic_to_remove: { type: 'STRING' }
              }
            },
            response: {
              type: 'STRING',
              description: 'The witty, empathetic J.A.R.V.I.S dialogue response text.'
            }
          },
          required: ['updates', 'response']
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      updates = result.updates || {};
      reply = result.response || "Sir, I have updated your telemetry log. How else may I assist you?";
    }
  } catch (error: any) {
    console.warn('Combined Gemini call failed. Running local heuristics and fallbacks:', error.message);
    // Fallback Step A: Heuristic Regex extraction
    updates = fallbackExtract(message, currentState);
    
    // Apply updates to state temporarily before generating response
    const tempState = JSON.parse(JSON.stringify(currentState));
    if (updates.current_mood) tempState.wellness_state.current_mood = updates.current_mood;
    if (updates.sleep_hours !== undefined) tempState.wellness_state.sleep_hours = updates.sleep_hours;
    if (updates.stress_level) tempState.wellness_state.stress_level = updates.stress_level;
    if (updates.current_subject) tempState.academic_state.current_subject = updates.current_subject;
    if (updates.current_topic) tempState.academic_state.current_topic = updates.current_topic;
    if (updates.mastered_topic_to_add) {
      if (!tempState.academic_state.mastered_topics.includes(updates.mastered_topic_to_add)) {
        tempState.academic_state.mastered_topics.push(updates.mastered_topic_to_add);
      }
    }
    
    // Fallback Step B: Contextual response generator
    reply = generateFallbackResponse(tempState, message, error);
  }

  console.log('Processed updates:', updates);

  // Apply updates deterministically to main state
  if (updates.current_mood) {
    currentState.wellness_state.current_mood = updates.current_mood;
  }
  if (updates.sleep_hours !== undefined) {
    currentState.wellness_state.sleep_hours = updates.sleep_hours;
  }
  if (updates.stress_level) {
    currentState.wellness_state.stress_level = updates.stress_level;
  }
  if (updates.current_subject) {
    currentState.academic_state.current_subject = updates.current_subject;
  }
  if (updates.current_topic) {
    currentState.academic_state.current_topic = updates.current_topic;
  }
  if (updates.mastered_topic_to_add) {
    const topic = updates.mastered_topic_to_add;
    if (!currentState.academic_state.mastered_topics.includes(topic)) {
      currentState.academic_state.mastered_topics.push(topic);
    }
  }
  if (updates.mastered_topic_to_remove) {
    currentState.academic_state.mastered_topics = currentState.academic_state.mastered_topics.filter(
      (t: string) => t !== updates.mastered_topic_to_remove
    );
  }

  // Save updated state
  writeState(currentState);

  res.json({
    response: reply,
    state: currentState
  });
});

app.listen(PORT, () => {
  console.log(`J.A.R.V.I.S Server running on http://localhost:${PORT}`);
});

export default app;
