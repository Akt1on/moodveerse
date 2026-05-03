---
name: Voice (TTS + Speech Input)
description: ElevenLabs multilingual TTS for poem narration via tts-speak edge function; Web Speech API for dictation in MoodForm. Language auto-detected from text (Cyrillic→ru, Armenian→hy, else en).
type: feature
---

## TTS (Text-to-Speech)
- Edge function: `supabase/functions/tts-speak/index.ts`
- Provider: ElevenLabs `eleven_multilingual_v2`, output `mp3_44100_128`
- Default voice: Matilda (`XrExE9yKIg1WjnnlVkGX`) — soft, expressive, multilingual
- English fallback: George (`JBFqnCBsd6RMkjVDRZzb`)
- Returns `{ audio: base64, mime: "audio/mpeg" }`; client plays via data URI
- Settings tuned for literary narration: stability 0.55, style 0.35, speed 0.92
- Language auto-detected client-side in PieceCard (`detectLang`)
- Max input: 3000 chars (clipped to 2800 in client)
- Requires secret: `ELEVENLABS_API_KEY`

## Speech Input
- Component: `MoodForm.tsx` mic button (top-right of textarea)
- API: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- Continuous + interim results, language follows selected `lang` pref
- Graceful fallback: button hidden if API not supported
