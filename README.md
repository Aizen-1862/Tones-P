# Tones:P — adaptive music player

Tones:P is a phone-friendly music player prototype with a minimal, album-art-focused discovery direction and adaptive synchronized lyrics.

## Implemented in this branch
- Responsive player with play/pause, seek, volume, and elapsed/total time.
- Local audio file playback; local files are not uploaded.
- Load or paste timed `.lrc` lyrics.
- Automatic / Playful / Emotional / Hype / Dreamy visual moods.
- Audio-reactive background effects.
- Backend health check, local catalogue endpoint, style recipes, and Audius-backed online music search.
- Online results link back to their Audius track page. Tones:P does not host or re-upload audio.

## Online discovery setup

The app uses Audius's read-only API, which supports track search and streaming. Many read-only endpoints work without credentials; an optional `AUDIUS_API_KEY` backend environment variable can be set for higher rate limits. Never put a bearer token or private credential in frontend files.

1. Deploy the backend from the `backend` directory in Render with build command `npm install` and start command `npm start`.
2. Check `/api/health` on the deployed backend. It should report `musicProvider: "Audius"`.
3. Open `config.js` and set `API_BASE_URL` to the actual deployed backend URL, without a trailing slash.
4. Test `/api/catalog/search?q=jazz` on the backend, then try the search UI.
5. Confirm the GitHub Actions validation workflow passes before merging this branch into `main`.

Audius API documentation: https://docs.audius.co/  
API plans: https://api.audius.co/plans

## Rights and attribution

Audius is a platform for independent artists, but that does not mean every track is public-domain or free to reuse. Tones:P streams through Audius's official stream endpoint and links to the artist's Audius page; it does not claim a blanket licence for tracks. Before distributing the app or using music in a public/commercial product, review Audius's current terms and the rights/permissions that apply to each track. Do not scrape, re-host, or cache audio, and do not add copyrighted lyrics without permission.

## Current limitations
- This is not yet a finished streaming service or Android app.
- The online catalogue depends on the provider API and network availability.
- Search results may not include mainstream commercial releases.
- LRC files usually provide line-level timestamps, so word animation is only an approximate visual effect.
- The starter does not scrape commercial music or lyrics.
- The public GitHub Pages site will not have online discovery until a backend is deployed and configured.

## Run locally

Requires Node.js 18+.

1. Open a terminal in `backend/`.
2. Run `npm install`.
3. Run `npm start`.
4. Serve the frontend through a local static server and set `API_BASE_URL` in `config.js` to `http://localhost:3000`.

## LRC format
```text
[00:00.00]First lyric line
[00:04.20]Second lyric line
[00:08.00]Third lyric line
```

## Branches
- `main`: existing live website; intentionally untouched by this redesign.
- `tones-p-discovery-redesign`: Tones:P rebrand, discovery UI, and Audius backend integration.
- `android-app-starter`: separate Android wrapper experiment, postponed until the product is ready.
