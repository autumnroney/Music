# Tunesmith: AI Song Studio

A one-page web app for creating music with [SunoAPI](https://docs.sunoapi.org/). Users paste their own SunoAPI key to get in, then write, generate, remix and export songs from one screen. It has no build step and no backend beyond Netlify's proxy.

## Features

| Area | What you can do | SunoAPI endpoint |
| --- | --- | --- |
| **Access** | Enter an API key (remember it on this device or only for this tab), see remaining credits live | `GET /api/v1/generate/credit` |
| **Models** | V6 (recommended), V6 Wild, V6 Mini, plus the legacy V5.5 / V5 / V4.5+ / V4.5 All / V4.5 / V4 | all generation endpoints |
| **Create · Simple** | Describe a song, get ideas from "Surprise me", pick instrumental, attach image/audio/video inspiration | `POST /api/v1/generate` (`customMode:false`) |
| **Create · Custom** | Title, style chips, ✨ Boost style, lyrics with section tags, 🪄 AI lyrics, vocal gender, negative tags, target length, style weight / weirdness / audio weight / variety, personas | `POST /api/v1/generate` (`customMode:true`), `POST /api/v1/style/generate`, `POST /api/v1/lyrics` |
| **Remix** | Cover, extend, add vocals, add backing band, mashup, and split stems on uploaded audio | `upload-cover`, `upload-extend`, `add-vocals`, `add-instrumental`, `mashup`, `vocal-removal` + File Upload API |
| **Sounds** | Loops and sound effects with BPM, key and seamless loop options | `POST /api/v1/generate/sounds` |
| **Lyrics** | Generate several lyric drafts and send one to Custom | `POST /api/v1/lyrics` |
| **Per-track actions** | Extend, replace a section, sing-along (karaoke) lyrics, WAV export, stems (2 / full band / one instrument), MIDI (downloads a real `.mid`), music video, cover art, save the voice as a persona, reuse settings, send to Remix | `extend`, `replace-section`, `get-timestamped-lyrics`, `wav`, `vocal-removal`, `midi`, `mp4`, `suno/cover`, `generate-persona` |
| **Library** | Saved in the browser, with live progress (Queued → Lyrics → First take → Ready), streaming playback before mastering finishes, favorites, search, retry and "make another version" | `record-info` polling for each task type |
| **Player** | Sticky player with next/previous, seeking, Space to play/pause, Media Session support, download | |
| **Theme** | Light, Dark and System | |

## Architecture

```
public/
  index.html   markup for the gate, studio, library, player, karaoke and dialog
  styles.css   design tokens with light/dark themes, responsive layout
  app.js       all app logic (vanilla JS, no dependencies)
netlify/functions/suno-callback.mjs   no-op 200 endpoint for SunoAPI's required callBackUrl
netlify.toml   publish dir, same-origin proxy rewrites, security headers
```

- **CORS:** the browser calls `/suno/*` and `/sunoupload/*`, and Netlify rewrites those to `https://api.sunoapi.org` and `https://sunoapiorg.redpandaai.co`. If the proxy isn't there (for example on a plain static server), the app falls back to calling SunoAPI directly.
- **Results:** SunoAPI requires a `callBackUrl`, so the app points it at the no-op function. It reads results by polling the `record-info` endpoints every 5 seconds, and picks polling back up if the page is reloaded.
- **Key handling:** the key is stored in `localStorage` ("Remember") or `sessionStorage`. It is sent only in the `Authorization` header and never stored on a server.

## Deploy to Netlify

1. Connect this repo in Netlify. `netlify.toml` already sets the publish directory (`public`) and functions directory. There is no build command.
2. Deploy and open the site. Paste a key from [sunoapi.org/api-key](https://sunoapi.org/api-key).

## Run locally

```bash
npx netlify-cli dev   # serves public/ with the proxy rules and the function
```

(`python3 -m http.server -d public` also works if SunoAPI allows CORS from your origin.)

## Not included

Suno Voice custom-voice creation, which needs a recorded verification phrase, and audio recovery are not built into the UI. Voice IDs made elsewhere can still be pasted into Custom → Advanced → Persona with the "Voice" type.
