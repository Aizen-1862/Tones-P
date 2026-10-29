const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const AUDIUS_API_BASE = "https://api.audius.co/v1";
const AUDIUS_APP_NAME = "TonesP";

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

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "tones-p-api",
    musicProvider: "Audius",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/tracks", (_req, res) => {
  const tracks = readTracks()
    .map(safeTrack)
    .filter(track => track.audioUrl && /^https:\/\//i.test(track.audioUrl));
  res.set("Cache-Control", "public, max-age=60");
  res.json({ tracks });
});

app.get("/api/catalog/search", async (req, res) => {
  const query = String(req.query.q || "").trim().slice(0, 100);
  if (!query) return res.status(400).json({ error: "Enter a search term." });

  const url = new URL(`${AUDIUS_API_BASE}/tracks/search`);
  url.search = new URLSearchParams({
    query,
    limit: "18",
    app_name: AUDIUS_APP_NAME
  }).toString();

  try {
    const headers = { Accept: "application/json" };
    if (process.env.AUDIUS_API_KEY) headers["x-api-key"] = process.env.AUDIUS_API_KEY;

    const upstream = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000)
    });

    if (!upstream.ok) {
      console.error("Audius search returned HTTP", upstream.status);
      return res.status(502).json({
        error: "Audius search is temporarily unavailable. Please try again shortly."
      });
    }

    const payload = await upstream.json();
    const results = Array.isArray(payload.data) ? payload.data : [];

    const tracks = results.map(track => {
      const artwork = track.artwork && typeof track.artwork === "object" ? track.artwork : {};
      const user = track.user && typeof track.user === "object" ? track.user : {};
      const trackId = String(track.id || "");
      const permalink = String(track.permalink || "");
      const providerUrl = permalink
        ? (permalink.startsWith("http") ? permalink : `https://audius.co${permalink.startsWith("/") ? "" : "/"}${permalink}`)
        : "https://audius.co/";

      return {
        id: trackId,
        title: String(track.title || "Untitled track"),
        artist: String(user.name || track.artist || "Independent artist"),
        audioUrl: trackId
          ? `${AUDIUS_API_BASE}/tracks/${encodeURIComponent(trackId)}/stream?${new URLSearchParams({ app_name: AUDIUS_APP_NAME }).toString()}`
          : "",
        artworkUrl: String(artwork["480x480"] || artwork["150x150"] || artwork["1000x1000"] || ""),
        mood: "auto",
        lyrics: "",
        provider: "Audius",
        providerUrl,
        duration: Number(track.duration || 0)
      };
    }).filter(track => track.id && /^https:\/\//i.test(track.audioUrl));

    res.set("Cache-Control", "no-store");
    res.json({ provider: "Audius", tracks });
  } catch (error) {
    console.error("Audius search failed:", error.message);
    res.status(502).json({
      error: "Could not reach Audius right now. Please try again later."
    });
  }
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

app.get("/", (_req, res) => res.type("text").send("Tones:P API is running. See /api/health and /api/catalog/search."));
app.listen(PORT, "0.0.0.0", () => console.log("Tones:P API listening on 0.0.0.0:" + PORT));
