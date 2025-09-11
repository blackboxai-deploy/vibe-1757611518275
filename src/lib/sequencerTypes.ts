// Core types for the DAW sequencer system

export interface Note {
  id: string;
  note: string; // e.g., "C4", "A#3"
  frequency: number;
  velocity: number; // 0-1
  startTime: number; // In beats
  duration: number; // In beats
  step: number; // Which step in the sequence (0-15, 0-31, etc)
}

export interface Pattern {
  id: string;
  name: string;
  notes: Note[];
  length: number; // Number of steps (8, 16, 32)
  bpm: number;
  waveform: OscillatorType;
  volume: number; // 0-1
  createdAt: Date;
  updatedAt: Date;
}

export interface Track {
  id: string;
  name: string;
  pattern: Pattern;
  muted: boolean;
  solo: boolean;
  volume: number; // 0-1
  pan: number; // -1 to 1
}

export interface TransportState {
  isPlaying: boolean;
  isRecording: boolean;
  currentStep: number;
  currentTime: number; // In seconds
  bpm: number;
  loop: boolean;
}

export interface AudioSettings {
  masterVolume: number; // 0-1
  waveform: OscillatorType;
  attack: number; // ADSR envelope
  decay: number;
  sustain: number;
  release: number;
}

export interface SequencerState {
  tracks: Track[];
  currentTrackId: string;
  transport: TransportState;
  audioSettings: AudioSettings;
  patternLibrary: Pattern[];
}

export interface PianoKey {
  note: string;
  frequency: number;
  isBlackKey: boolean;
  octave: number;
  keyIndex: number;
}

// Utility type for note events
export interface NoteEvent {
  type: 'noteOn' | 'noteOff';
  note: string;
  frequency: number;
  velocity: number;
  timestamp: number;
}

// Audio engine interfaces
export interface AudioEngineConfig {
  sampleRate: number;
  bufferSize: number;
  maxPolyphony: number;
}

export interface VoiceInstance {
  id: string;
  oscillator: OscillatorNode;
  gainNode: GainNode;
  note: string;
  frequency: number;
  startTime: number;
}