import { PianoKey } from './sequencerTypes';

// Note names in chromatic order
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_KEYS = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);

// A4 = 440Hz reference frequency
const A4_FREQUENCY = 440;
const A4_MIDI_NUMBER = 69;

/**
 * Calculate frequency from MIDI note number
 * Formula: f = 440 * 2^((n-69)/12)
 */
export function midiToFrequency(midiNumber: number): number {
  return A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI_NUMBER) / 12);
}

/**
 * Convert note name to MIDI number
 * e.g., "C4" -> 60, "A4" -> 69
 */
export function noteToMidi(noteName: string): number {
  const match = noteName.match(/^([A-G]#?)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid note name: ${noteName}`);
  }

  const [, note, octaveStr] = match;
  const octave = parseInt(octaveStr);
  const noteIndex = NOTE_NAMES.indexOf(note);
  
  if (noteIndex === -1) {
    throw new Error(`Invalid note: ${note}`);
  }

  return (octave + 1) * 12 + noteIndex;
}

/**
 * Convert note name to frequency
 */
export function noteToFrequency(noteName: string): number {
  const midiNumber = noteToMidi(noteName);
  return midiToFrequency(midiNumber);
}

/**
 * Convert MIDI number to note name
 */
export function midiToNote(midiNumber: number): string {
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  return NOTE_NAMES[noteIndex] + octave;
}

/**
 * Generate piano keys for a given octave range
 */
export function generatePianoKeys(startOctave: number = 3, endOctave: number = 6): PianoKey[] {
  const keys: PianoKey[] = [];
  let keyIndex = 0;

  for (let octave = startOctave; octave <= endOctave; octave++) {
    for (let noteIndex = 0; noteIndex < NOTE_NAMES.length; noteIndex++) {
      const noteName = NOTE_NAMES[noteIndex];
      const fullNote = `${noteName}${octave}`;
      const midiNumber = noteToMidi(fullNote);
      const frequency = midiToFrequency(midiNumber);
      const isBlackKey = BLACK_KEYS.has(noteName);

      keys.push({
        note: fullNote,
        frequency,
        isBlackKey,
        octave,
        keyIndex: keyIndex++
      });
    }
  }

  return keys;
}

/**
 * Get all white keys (natural notes)
 */
export function getWhiteKeys(keys: PianoKey[]): PianoKey[] {
  return keys.filter(key => !key.isBlackKey);
}

/**
 * Get all black keys (sharps/flats)
 */
export function getBlackKeys(keys: PianoKey[]): PianoKey[] {
  return keys.filter(key => key.isBlackKey);
}

/**
 * Get the next note in the chromatic scale
 */
export function getNextNote(noteName: string): string {
  const midiNumber = noteToMidi(noteName);
  return midiToNote(midiNumber + 1);
}

/**
 * Get the previous note in the chromatic scale
 */
export function getPreviousNote(noteName: string): string {
  const midiNumber = noteToMidi(noteName);
  return midiToNote(midiNumber - 1);
}

/**
 * Check if a note is a black key
 */
export function isBlackKey(noteName: string): boolean {
  const noteOnly = noteName.replace(/\d+$/, '');
  return BLACK_KEYS.has(noteOnly);
}

/**
 * Convert BPM to milliseconds per beat
 */
export function bpmToMs(bpm: number): number {
  return (60 * 1000) / bpm;
}

/**
 * Convert BPM to seconds per beat
 */
export function bpmToSeconds(bpm: number): number {
  return 60 / bpm;
}

/**
 * Quantize a time value to the nearest step
 */
export function quantizeToStep(time: number, stepDuration: number): number {
  return Math.round(time / stepDuration) * stepDuration;
}

/**
 * Generate a unique ID for notes and patterns
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}