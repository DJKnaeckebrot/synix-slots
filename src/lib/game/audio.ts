/**
 * Lightweight AudioManager — placeholder sounds via Web Audio beeps.
 * Persist mute/volume in localStorage. Swap oscillators for real assets later.
 */

const STORAGE_KEY = "rank-rush-audio";

export type SoundId =
  | "reel-spin"
  | "reel-stop"
  | "wheel-appear"
  | "wheel-tick"
  | "wheel-land"
  | "multiplier-add"
  | "multiplier-multiply"
  | "feature-trigger"
  | "feature-loop"
  | "rank-up"
  | "win"
  | "big-win"
  | "max-win";

type Settings = { muted: boolean; volume: number };

const FREQ: Partial<Record<SoundId, number>> = {
  "reel-stop": 220,
  "wheel-appear": 440,
  "wheel-land": 660,
  "multiplier-add": 520,
  "multiplier-multiply": 780,
  "feature-trigger": 340,
  "rank-up": 500,
  win: 700,
  "big-win": 880,
  "max-win": 990,
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return { muted: false, volume: 0.7 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { muted: false, volume: 0.7 };
    return JSON.parse(raw) as Settings;
  } catch {
    return { muted: false, volume: 0.7 };
  }
}

function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

class AudioManagerImpl {
  private ctx: AudioContext | null = null;
  private settings: Settings = loadSettings();

  private ensureCtx() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  get muted() {
    return this.settings.muted;
  }

  get volume() {
    return this.settings.volume;
  }

  setMuted(muted: boolean) {
    this.settings = { ...this.settings, muted };
    saveSettings(this.settings);
  }

  setVolume(volume: number) {
    this.settings = {
      ...this.settings,
      volume: Math.min(1, Math.max(0, volume)),
    };
    saveSettings(this.settings);
  }

  play(id: SoundId) {
    if (this.settings.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const freq = FREQ[id];
    if (!freq) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = id.includes("multiply") ? "square" : "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.001, this.settings.volume * 0.08),
      ctx.currentTime + 0.01,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }
}

export const AudioManager = new AudioManagerImpl();
