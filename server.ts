import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// In-memory persistent datastores for leaderboard, cloud save, and async challenges
interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  wave: number;
  mode: "classic" | "timeattack" | "coop";
  accuracy: number;
  cognitiveGrade: string;
  isFriend?: boolean;
  date: string;
  avatarSeed: number;
}

interface AsyncChallenge {
  id: string;
  creatorName: string;
  title: string;
  targetScore: number;
  targetWave: number;
  mode: "classic" | "timeattack";
  accuracyRequirement: number;
  cognitiveProfile: string;
  seed: number;
  completions: number;
  createdDate: string;
}

const mockLeaderboards: LeaderboardEntry[] = [
  { id: "1", name: "CyberViper", score: 148500, wave: 18, mode: "classic", accuracy: 89, cognitiveGrade: "S+", isFriend: false, date: "2026-09-08", avatarSeed: 1 },
  { id: "2", name: "RetroPhantom", score: 132400, wave: 16, mode: "classic", accuracy: 84, cognitiveGrade: "S", isFriend: true, date: "2026-09-09", avatarSeed: 2 },
  { id: "3", name: "NovaStrike", score: 119800, wave: 15, mode: "classic", accuracy: 81, cognitiveGrade: "A+", isFriend: true, date: "2026-09-07", avatarSeed: 3 },
  { id: "4", name: "PixelZero", score: 98400, wave: 13, mode: "classic", accuracy: 76, cognitiveGrade: "A", isFriend: false, date: "2026-09-08", avatarSeed: 4 },
  { id: "5", name: "Vortex90s", score: 86200, wave: 11, mode: "classic", accuracy: 72, cognitiveGrade: "B+", isFriend: false, date: "2026-09-06", avatarSeed: 5 },
  { id: "6", name: "SpeedDemon", score: 182000, wave: 12, mode: "timeattack", accuracy: 92, cognitiveGrade: "S+", isFriend: true, date: "2026-09-09", avatarSeed: 6 },
  { id: "7", name: "ChronoDrift", score: 154000, wave: 10, mode: "timeattack", accuracy: 86, cognitiveGrade: "S", isFriend: false, date: "2026-09-08", avatarSeed: 7 },
  { id: "8", name: "TwinBlasters", score: 215000, wave: 20, mode: "coop", accuracy: 85, cognitiveGrade: "S+", isFriend: true, date: "2026-09-07", avatarSeed: 8 },
];

const asyncChallenges: AsyncChallenge[] = [
  {
    id: "ch-alpha",
    creatorName: "RetroPhantom",
    title: "90s Gradius Formation Siege",
    targetScore: 75000,
    targetWave: 8,
    mode: "classic",
    accuracyRequirement: 75,
    cognitiveProfile: "Reflejos Cinéticos Avanzados",
    seed: 1337,
    completions: 14,
    createdDate: "2026-09-08"
  },
  {
    id: "ch-beta",
    creatorName: "SpeedDemon",
    title: "Chrono Bullet-Hell Rush",
    targetScore: 90000,
    targetWave: 6,
    mode: "timeattack",
    accuracyRequirement: 80,
    cognitiveProfile: "Adaptación Bajo Presión Extrema",
    seed: 4242,
    completions: 9,
    createdDate: "2026-09-09"
  },
  {
    id: "ch-gamma",
    creatorName: "CyberViper",
    title: "Contra Alien Hive Protocol",
    targetScore: 110000,
    targetWave: 12,
    mode: "classic",
    accuracyRequirement: 85,
    cognitiveProfile: "Precisión Táctica y Evasión Espacial",
    seed: 9999,
    completions: 4,
    createdDate: "2026-09-07"
  }
];

const cloudSaves: Record<string, any> = {};

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Leaderboard API
app.get("/api/leaderboard", (req, res) => {
  const mode = (req.query.mode as string) || "classic";
  const friendsOnly = req.query.friends === "true";

  let results = mockLeaderboards.filter((entry) => entry.mode === mode);
  if (friendsOnly) {
    results = results.filter((entry) => entry.isFriend);
  }

  results.sort((a, b) => b.score - a.score);
  res.json({ success: true, count: results.length, data: results });
});

app.post("/api/leaderboard", (req, res) => {
  const { name, score, wave, mode, accuracy, cognitiveGrade, isFriend } = req.body;
  if (!name || typeof score !== "number") {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const newEntry: LeaderboardEntry = {
    id: `entry-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: String(name).slice(0, 16),
    score,
    wave: wave || 1,
    mode: mode || "classic",
    accuracy: Math.min(100, Math.max(0, accuracy || 0)),
    cognitiveGrade: cognitiveGrade || "A",
    isFriend: Boolean(isFriend),
    date: new Date().toISOString().split("T")[0],
    avatarSeed: Math.floor(Math.random() * 8) + 1
  };

  mockLeaderboards.push(newEntry);
  res.json({ success: true, entry: newEntry });
});

// Async Challenges API
app.get("/api/challenges", (_req, res) => {
  res.json({ success: true, data: asyncChallenges });
});

app.post("/api/challenges", (req, res) => {
  const { creatorName, title, targetScore, targetWave, mode, accuracyRequirement, cognitiveProfile } = req.body;
  const newChallenge: AsyncChallenge = {
    id: `ch-${Date.now()}`,
    creatorName: creatorName || "Anonymous Pilot",
    title: title || "Desafío Asíncrono Clásico",
    targetScore: Number(targetScore) || 50000,
    targetWave: Number(targetWave) || 5,
    mode: mode || "classic",
    accuracyRequirement: Number(accuracyRequirement) || 70,
    cognitiveProfile: cognitiveProfile || "Evasión Táctica",
    seed: Math.floor(Math.random() * 90000) + 10000,
    completions: 0,
    createdDate: new Date().toISOString().split("T")[0]
  };

  asyncChallenges.unshift(newChallenge);
  res.json({ success: true, challenge: newChallenge });
});

// Cloud Save Sync API
app.get("/api/cloud-save/:userId", (req, res) => {
  const { userId } = req.params;
  const save = cloudSaves[userId];
  if (!save) {
    res.json({ success: true, data: null, message: "No cloud save found for user" });
    return;
  }
  res.json({ success: true, data: save });
});

app.post("/api/cloud-save/sync", (req, res) => {
  const { userId, state } = req.body;
  if (!userId || !state) {
    res.status(400).json({ error: "userId and state are required" });
    return;
  }
  cloudSaves[userId] = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  res.json({ success: true, message: "Cloud save synchronized successfully", timestamp: cloudSaves[userId].updatedAt });
});

// Cognitive Analysis API
app.post("/api/cognitive-analysis", async (req, res) => {
  const { metrics, wave, score, accuracy, playDurationSeconds, mode } = req.body;

  // Real-time behavioral heuristic metrics calculation
  const reactionMs = metrics?.avgReactionTimeMs || 280;
  const stressIndex = metrics?.stressIndex || 45; // 0 - 100
  const evasionEfficiency = metrics?.evasionEfficiency || 78; // 0 - 100
  const panicFiringRatio = metrics?.panicFiringRatio || 15; // 0 - 100

  // Determine cognitive profile archetype based on 90s classic gaming traits
  let archetype = "Piloto Equilibrado (Estilo Gradius)";
  let adaptationAdvice = "Mantén la cadencia rítmica en lugar de disparos en ráfaga continua.";
  let dynamicDifficultyTuning = {
    bulletSpeedMod: 1.0,
    alienCadenceMod: 1.0,
    powerupFrequencyMod: 1.0,
    suggestedLevelPattern: "Contra Wall Assault"
  };

  if (reactionMs < 240 && accuracy > 80) {
    archetype = "Estratega Hipercinético (Estilo R-Type / Contra)";
    adaptationAdvice = "Tus reflejos superan el percentil 90. Incrementando densidad de proyectiles y patrones cruzados.";
    dynamicDifficultyTuning = {
      bulletSpeedMod: 1.18,
      alienCadenceMod: 1.25,
      powerupFrequencyMod: 0.9,
      suggestedLevelPattern: "Galaga Dive Sweeps"
    };
  } else if (panicFiringRatio > 40 || stressIndex > 65) {
    archetype = "Respondedor Bajo Tensión (Estilo Space Invaders 1978)";
    adaptationAdvice = "Detectada sobrecarga sensorial. Desplegando drops de escudos cinéticos y ralentizando descenso.";
    dynamicDifficultyTuning = {
      bulletSpeedMod: 0.85,
      alienCadenceMod: 0.88,
      powerupFrequencyMod: 1.35,
      suggestedLevelPattern: "Space Invaders Classic Phalanx"
    };
  } else if (evasionEfficiency > 85) {
    archetype = "Maestro de Evasión Vectorial (Estilo Asteroids / Defender)";
    adaptationAdvice = "Evasión de impactos impecable. Los jefes emplearán barriles de láser concentrado.";
    dynamicDifficultyTuning = {
      bulletSpeedMod: 1.1,
      alienCadenceMod: 1.15,
      powerupFrequencyMod: 1.05,
      suggestedLevelPattern: "Mega Man Hazard Surge"
    };
  }

  // If Gemini API Key is present, generate enriched AI analysis
  let aiNarrative: string | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Actúa como la computadora táctica de un videojuego arcade retro de los 90s.
Analiza la siguiente conducta cognitiva del piloto:
- Modo: ${mode}
- Puntuación: ${score}
- Oleada: ${wave}
- Precisión: ${accuracy}%
- Tiempo de reacción medio: ${reactionMs} ms
- Índice de estrés: ${stressIndex}%
- Eficiencia de evasión: ${evasionEfficiency}%
- Disparos de pánico: ${panicFiringRatio}%
- Arquetipo 90s: ${archetype}

Entrega una evaluación táctico-cognitiva concisa (máximo 3 frases) con jerga de arcade retro sci-fi (tipo SNES/Arcade 1994) explicando cómo el sistema adaptará la dificultad para su próxima oleada.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      if (response.text) {
        aiNarrative = response.text.trim();
      }
    } catch (err) {
      console.warn("Gemini cognitive debrief fallback to procedural narrative:", err);
    }
  }

  res.json({
    success: true,
    archetype,
    reactionMs,
    stressIndex,
    evasionEfficiency,
    panicFiringRatio,
    adaptationAdvice,
    dynamicDifficultyTuning,
    aiNarrative: aiNarrative || `TELEMETRÍA COGNITIVA ACTIVA: Patrón ${archetype} confirmado. Tiempo de respuesta ${reactionMs}ms detectado. Compensación algorítmica aplicada para la siguiente oleada de invasores.`
  });
});

// Vite middleware for development vs static production server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Space Invaders Server] listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
