// Global single-track audio manager: only one TTS voice plays at a time.
type StopListener = () => void;

let current: HTMLAudioElement | null = null;
let currentOwner: string | null = null;
let onStop: StopListener | null = null;

export function stopAudio() {
  if (current) {
    current.pause();
    current.currentTime = 0;
  }
  const cb = onStop;
  current = null;
  currentOwner = null;
  onStop = null;
  cb?.();
}

export async function playAudio(owner: string, audio: HTMLAudioElement, stopped: StopListener) {
  stopAudio();
  current = audio;
  currentOwner = owner;
  onStop = stopped;
  audio.onended = () => { if (currentOwner === owner) stopAudio(); };
  await audio.play();
}

export const isPlaying = (owner: string) => currentOwner === owner;
