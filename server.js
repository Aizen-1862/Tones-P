const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
app.disable("x-powered-by");
app.use(cors({ origin: true }));
app.use(express.json({ limit: "100kb" }));

const tracksPath = path.join(__dirname, "data", "tracks.json");
function readTracks() {
  try {
    const value = JSON.parse(fs.readFileSync(tracksPath, "utf8"));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error("Could not read tracks.json:", error.message);
    return [];
  }
}
function safeTrack(track) {
  return {
    id: String(track.id || ""),
    title: String(track.title || "Untitled track"),
    artist: String(track.artist || "Unknown artist"),
    audioUrl: String(track.audioUrl || ""),
    artworkUrl: String(track.artworkUrl || ""),
    mood: ["auto", "playful", "emotional", "hype", "dreamy"].includes(track.mood) ? track.mood : "auto",
    lyrics: typeof track.lyrics === "string" ? track.lyrics : ""
  };
}
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "lyric-motion-api", timestamp: new Date().toISOString() }));
app.get("/api/tracks", (_req, res) => {
  const tracks = readTracks().map(safeTrack).filter(track => track.audioUrl && /^https?:\/\//i.test(track.audioUrl));
  res.set("Cache-Control", "public, max-age=60");
  res.json({ tracks });
});
app.get("/api/style/:mood", (req, res) => {
  const recipes = {
    playful: { name: "Playful Pop", palette: ["#ff7ed3", "#ffd568", "#66e7e4"], typography: "bouncy", motion: "pop, bounce, rotate", intensity: 0.7 },
    emotional: { name: "Emotional", palette: ["#6899ff", "#b57eff", "#ff8fbe"], typography: "soft", motion: "fade, drift, blur", intensity: 0.25 },
    hype: { name: "High Energy", palette: ["#ff6b52", "#ffc056", "#66e0ff"], typography: "bold", motion: "slam, scale, pulse", intensity: 1 },
    dreamy: { name: "Dream State", palette: ["#78eddc", "#b09eff", "#ffabe0"], typography: "fluid", motion: "float, wave, glow", intensity: 0.35 }
  };
  const mood = String(req.params.mood || "").toLowerCase();
  if (!recipes[mood]) return res.status(404).json({ error: "Unknown mood", supported: Object.keys(recipes) });
  res.json({ mood, recipe: recipes[mood] });
});
app.get("/", (_req, res) => res.type("text").send("Lyric Motion API is running. See /api/health and /api/tracks."));
app.listen(PORT, "0.0.0.0", () => console.log(`Lyric Motion API listening on 0.0.0.0:${PORT}`));
