# Tones:P — adaptive music player

Tones:P is a phone-friendly music player prototype with a minimal, album-art-focused discovery direction and adaptive synchronized lyrics.

## Implemented in this branch
- Responsive player with play/pause, seek, volume, and elapsed/total time.
- Local audio file playback; local files are not uploaded.
- Load or paste timed `.lrc` lyrics.
- Automatic / Playful / Emotional / Hype / Dreamy visual moods.
- Audio-reactive background effects.
- Backend health check, local catalogue endpoint, style recipes, and a Jamendo-backed online music search endpoint.
- Online results include the provider's licence link. Tones:P does not host the audio.

## Online discovery setup
Online search remains disabled until the backend URL and provider client ID are configured.

1. Register an application on the Jamendo developer portal: https://devportal.jamendo.com/
2. Add `JAMENDO_CLIENT_ID` to the backend service's environment variables in Render. Keep private credentials on the backend, never in frontend files.
3. Deploy the backend from the `backend` directory with build command `npm install` and start command `npm start`.
4. Check `/api/health` on the deployed backend.
5. Set `API_BASE_URL` in `config.js` to the actual deployed backend URL, without a trailing slash.
6. Test `/api/catalog/search?q=jazz` on the backend, then try the search UI.

Jamendo's published API terms state that the API is available for non-commercial use by default. Review the current terms and each track's Creative Commons licence before sharing or publishing the app. The app filters out results without an HTTPS audio URL and a licence URL; this is not a substitute for checking licence conditions.

## Current limitations
- This is not yet a finished streaming service or Android app.
- The online catalogue depends on provider API availability and valid credentials.
- LRC files usually provide line-level timestamps, so word animation is only an approximate visual effect.
- The starter does not scrape commercial music or lyrics.

## Run locally
Requires Node.js 18+.
1. Open a terminal in `backend/`.
2. Run `npm install`.
3. Set `JAMENDO_CLIENT_ID` in your environment to enable online search.
4. Run `npm start`.
5. Serve the frontend through a local static server and set `API_BASE_URL` in `config.js` to `http://localhost:3000`.

## LRC format
```text
[00:00.00]First lyric line
[00:04.20]Second lyric line
[00:08.00]Third lyric line
```

## Branches
- `main`: existing live website; intentionally untouched by this redesign.
- `tones-p-discovery-redesign`: Tones:P rebrand, discovery UI, and Jamendo backend integration.
- `android-app-starter`: separate Android wrapper experiment, postponed until the product is ready.

## Rights and attribution
Only use audio and lyrics when their licence permits the intended use. Jamendo tracks may have different Creative Commons conditions, including attribution and non-commercial restrictions. Do not add copyrighted lyrics unless you have permission to display them.
