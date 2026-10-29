# Lyric Motion — Adaptive Music Player (Starter MVP)

A phone-friendly music player prototype where the visual language changes with the song's mood and energy.

## What works in this starter
- Responsive music player UI.
- Play/pause, seek, volume, and elapsed/total time.
- Upload a local audio file to play it in the browser.
- Upload an `.lrc` timed-lyrics file, or paste timed LRC text.
- Line-synchronized lyrics, with word-by-word visual emphasis as a visual approximation.
- Song mood selector (Automatic / Playful / Emotional / Hype / Dreamy).
- Audio-reactive background effects using the Web Audio API.
- A backend API with health check, sample-track configuration, and style-recipe endpoint.
- No API keys required for the local-upload demo.

## Important MVP limitations
- This starter does **not** scrape commercial music or lyrics.
- Audio uploads are played locally in the browser and are not uploaded to a server.
- LRC files normally provide line-level timestamps, not exact word timestamps. The word animation is an approximate visual effect until genuine word-level timestamps are available.
- The included catalogue is intentionally empty: add tracks only when you have a legal audio URL and the rights to stream it. An API catalogue listing does not automatically grant playback or lyric rights.
- AI visual selection is represented by a deterministic automatic style engine for now, so the site works without a paid AI key. A server-side AI provider can be added later.

## Folder structure
- `frontend/` — deployable static site (GitHub Pages)
- `backend/` — Node.js/Express API (Render or local)
- `render.yaml` — Render Blueprint starter
- `.gitignore`

## Run locally
Requires Node.js 18+.

1. Open a terminal in `backend/`.
2. Run `npm install`
3. Run `npm start`
4. Open `frontend/index.html` in a browser, or serve `frontend/` with a static server.
5. For local backend use, the frontend auto-defaults to `http://localhost:3000`.

If opening `index.html` directly, some browsers restrict network calls. A simple static server is recommended.

## Deploy frontend to GitHub Pages
1. Create a new GitHub repository, e.g. `lyric-motion`.
2. Upload the contents of this ZIP, keeping the `frontend` and `backend` folders.
3. In GitHub, open **Settings → Pages**.
4. Set the source to **Deploy from a branch**, choose `main`, and choose `/frontend` only if GitHub Pages offers that folder option. Otherwise, move/copy the contents of `frontend/` to the repository root or use GitHub Actions.
5. Set `API_BASE_URL` in `frontend/config.js` to your deployed backend URL (for example `https://your-service.onrender.com`). Do not include a trailing slash.
6. Commit the change. GitHub Pages will publish the site.

## Deploy backend to Render
1. Create a new **Web Service** in Render and connect the repository.
2. Set **Root Directory** to `backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Render provides `PORT`; the server binds to `0.0.0.0`.
6. Copy the Render URL into `frontend/config.js` as `API_BASE_URL`.
7. Redeploy the frontend after committing the config change.

A free hosting tier can sleep or have usage limits. Availability and free-tier terms can change.

## Adding an authorized catalogue
Edit `backend/data/tracks.json`. Every track should include:
- `id`, `title`, `artist`
- `audioUrl` — direct audio URL that the provider permits your app to play
- `artworkUrl` — optional image URL
- `mood` — optional hint: `playful`, `emotional`, `hype`, `dreamy`
- `lyrics` — optional LRC string only when you have permission to display it

Example:
```json
[
  {
    "id": "licensed-track-1",
    "title": "Example track",
    "artist": "Artist name",
    "audioUrl": "https://example.com/authorized-audio.mp3",
    "artworkUrl": "",
    "mood": "playful",
    "lyrics": "[00:01.00]Example line goes here"
  }
]
```
Use real URLs only when you have permission. Do not add copyrighted lyrics unless your license allows it.

## LRC format
```text
[00:00.00]First lyric line
[00:04.20]Second lyric line
[00:08.00]Third lyric line
```

## Security
- Never place private API keys in `frontend/`.
- This starter does not require API keys.
- If you later add an AI provider, call it from the backend and keep credentials in Render environment variables.
