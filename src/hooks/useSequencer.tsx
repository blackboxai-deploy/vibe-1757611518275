'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { SequencerState, Track, Pattern, Note, TransportState, AudioSettings } from '@/lib/sequencerTypes';
import { generateId } from '@/lib/noteUtils';
import { audioEngine } from '@/lib/audioEngine';

// Initial state
const initialAudioSettings: AudioSettings = {
  masterVolume: 0.7,
  waveform: 'sine',
  attack: 0.01,
  decay: 0.1,
  sustain: 0.6,
  release: 0.5
};

const initialTransportState: TransportState = {
  isPlaying: false,
  isRecording: false,
  currentStep: 0,
  currentTime: 0,
  bpm: 120,
  loop: true
};

const createEmptyPattern = (): Pattern => ({
  id: generateId(),
  name: 'New Pattern',
  notes: [],
  length: 16,
  bpm: 120,
  waveform: 'sine',
  volume: 0.7,
  createdAt: new Date(),
  updatedAt: new Date()
});

const createEmptyTrack = (): Track => ({
  id: generateId(),
  name: 'Track 1',
  pattern: createEmptyPattern(),
  muted: false,
  solo: false,
  volume: 0.7,
  pan: 0
});

const initialState: SequencerState = {
  tracks: [createEmptyTrack()],
  currentTrackId: '',
  transport: initialTransportState,
  audioSettings: initialAudioSettings,
  patternLibrary: []
};

// Initialize current track ID
initialState.currentTrackId = initialState.tracks[0].id;

// Action types
type SequencerAction =
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_RECORDING'; payload: boolean }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_BPM'; payload: number }
  | { type: 'SET_LOOP'; payload: boolean }
  | { type: 'ADD_NOTE'; payload: { trackId: string; note: Note } }
  | { type: 'REMOVE_NOTE'; payload: { trackId: string; noteId: string } }
  | { type: 'CLEAR_PATTERN'; payload: string }
  | { type: 'SET_PATTERN_LENGTH'; payload: { trackId: string; length: number } }
  | { type: 'SET_TRACK_VOLUME'; payload: { trackId: string; volume: number } }
  | { type: 'SET_TRACK_MUTED'; payload: { trackId: string; muted: boolean } }
  | { type: 'SET_TRACK_SOLO'; payload: { trackId: string; solo: boolean } }
  | { type: 'SET_CURRENT_TRACK'; payload: string }
  | { type: 'ADD_TRACK'; payload: Track }
  | { type: 'REMOVE_TRACK'; payload: string }
  | { type: 'SET_MASTER_VOLUME'; payload: number }
  | { type: 'SET_WAVEFORM'; payload: OscillatorType }
  | { type: 'SAVE_PATTERN'; payload: Pattern }
  | { type: 'LOAD_PATTERN'; payload: { trackId: string; pattern: Pattern } }
  | { type: 'LOAD_STATE'; payload: SequencerState };

// Reducer
function sequencerReducer(state: SequencerState, action: SequencerAction): SequencerState {
  switch (action.type) {
    case 'SET_PLAYING':
      return {
        ...state,
        transport: { ...state.transport, isPlaying: action.payload }
      };

    case 'SET_RECORDING':
      return {
        ...state,
        transport: { ...state.transport, isRecording: action.payload }
      };

    case 'SET_CURRENT_STEP':
      return {
        ...state,
        transport: { ...state.transport, currentStep: action.payload }
      };

    case 'SET_BPM':
      return {
        ...state,
        transport: { ...state.transport, bpm: action.payload },
        tracks: state.tracks.map(track => ({
          ...track,
          pattern: { ...track.pattern, bpm: action.payload }
        }))
      };

    case 'SET_LOOP':
      return {
        ...state,
        transport: { ...state.transport, loop: action.payload }
      };

    case 'ADD_NOTE':
      return {
        ...state,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? {
                ...track,
                pattern: {
                  ...track.pattern,
                  notes: [...track.pattern.notes, action.payload.note],
                  updatedAt: new Date()
                }
              }
            : track
        )
      };

    case 'REMOVE_NOTE':
      return {
        ...state,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? {
                ...track,
                pattern: {
                  ...track.pattern,
                  notes: track.pattern.notes.filter(note => note.id !== action.payload.noteId),
                  updatedAt: new Date()
                }
              }
            : track
        )
      };

    case 'CLEAR_PATTERN':
      return {
        ...state,
        tracks: state.tracks.map(track =>
          track.id === action.payload
            ? {
                ...track,
                pattern: {
                  ...track.pattern,
                  notes: [],
                  updatedAt: new Date()
                }
              }
            : track
        )
      };

    case 'SET_PATTERN_LENGTH':
      return {
        ...state,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? {
                ...track,
                pattern: {
                  ...track.pattern,
                  length: action.payload.length,
                  updatedAt: new Date()
                }
              }
            : track
        )
      };

    case 'SET_TRACK_VOLUME':
      return {
        ...state,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? { ...track, volume: action.payload.volume }
            : track
        )
      };

    case 'SET_TRACK_MUTED':
      return {
        ...state,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? { ...track, muted: action.payload.muted }
            : track
        )
      };

    case 'SET_TRACK_SOLO':
      return {
        ...state,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? { ...track, solo: action.payload.solo }
            : track
        )
      };

    case 'SET_CURRENT_TRACK':
      return {
        ...state,
        currentTrackId: action.payload
      };

    case 'ADD_TRACK':
      return {
        ...state,
        tracks: [...state.tracks, action.payload]
      };

    case 'REMOVE_TRACK':
      return {
        ...state,
        tracks: state.tracks.filter(track => track.id !== action.payload),
        currentTrackId: state.tracks.length > 1
          ? state.tracks.find(track => track.id !== action.payload)?.id || state.tracks[0].id
          : state.currentTrackId
      };

    case 'SET_MASTER_VOLUME':
      return {
        ...state,
        audioSettings: { ...state.audioSettings, masterVolume: action.payload }
      };

    case 'SET_WAVEFORM':
      return {
        ...state,
        audioSettings: { ...state.audioSettings, waveform: action.payload }
      };

    case 'SAVE_PATTERN':
      return {
        ...state,
        patternLibrary: [...state.patternLibrary.filter(p => p.id !== action.payload.id), action.payload]
      };

    case 'LOAD_PATTERN':
      return {
        ...state,
        tracks: state.tracks.map(track =>
          track.id === action.payload.trackId
            ? { ...track, pattern: action.payload.pattern }
            : track
        )
      };

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

// Context
interface SequencerContextType {
  state: SequencerState;
  dispatch: React.Dispatch<SequencerAction>;
  // Convenience methods
  play: () => void;
  stop: () => void;
  togglePlayback: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  addNoteToCurrentTrack: (note: Note) => void;
  getCurrentTrack: () => Track | undefined;
  savePattern: (trackId: string, name?: string) => void;
  loadPattern: (trackId: string, pattern: Pattern) => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

const SequencerContext = createContext<SequencerContextType | undefined>(undefined);

interface SequencerProviderProps {
  children: ReactNode;
}

export function SequencerProvider({ children }: SequencerProviderProps) {
  const [state, dispatch] = useReducer(sequencerReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('daw-sequencer-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } catch (error) {
        console.error('Failed to load sequencer state:', error);
      }
    }
  }, []);

  // Save to localStorage on state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('daw-sequencer-state', JSON.stringify(state));
    }, 1000); // Debounce saves

    return () => clearTimeout(timeoutId);
  }, [state]);

  // Playback management
  const play = () => {
    dispatch({ type: 'SET_PLAYING', payload: true });
  };

  const stop = () => {
    dispatch({ type: 'SET_PLAYING', payload: false });
    dispatch({ type: 'SET_CURRENT_STEP', payload: 0 });
    audioEngine.stopAllNotes();
  };

  const togglePlayback = () => {
    if (state.transport.isPlaying) {
      stop();
    } else {
      play();
    }
  };

  const startRecording = () => {
    dispatch({ type: 'SET_RECORDING', payload: true });
    if (!state.transport.isPlaying) {
      play();
    }
  };

  const stopRecording = () => {
    dispatch({ type: 'SET_RECORDING', payload: false });
  };

  const addNoteToCurrentTrack = (note: Note) => {
    dispatch({ type: 'ADD_NOTE', payload: { trackId: state.currentTrackId, note } });
  };

  const getCurrentTrack = () => {
    return state.tracks.find(track => track.id === state.currentTrackId);
  };

  const savePattern = (trackId: string, name?: string) => {
    const track = state.tracks.find(t => t.id === trackId);
    if (track) {
      const pattern = {
        ...track.pattern,
        name: name || track.pattern.name,
        updatedAt: new Date()
      };
      dispatch({ type: 'SAVE_PATTERN', payload: pattern });
    }
  };

  const loadPattern = (trackId: string, pattern: Pattern) => {
    dispatch({ type: 'LOAD_PATTERN', payload: { trackId, pattern } });
  };

  const saveToLocalStorage = () => {
    localStorage.setItem('daw-sequencer-state', JSON.stringify(state));
  };

  const loadFromLocalStorage = () => {
    const savedState = localStorage.getItem('daw-sequencer-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } catch (error) {
        console.error('Failed to load sequencer state:', error);
      }
    }
  };

  const contextValue: SequencerContextType = {
    state,
    dispatch,
    play,
    stop,
    togglePlayback,
    startRecording,
    stopRecording,
    addNoteToCurrentTrack,
    getCurrentTrack,
    savePattern,
    loadPattern,
    saveToLocalStorage,
    loadFromLocalStorage
  };

  return (
    <SequencerContext.Provider value={contextValue}>
      {children}
    </SequencerContext.Provider>
  );
}

export function useSequencer(): SequencerContextType {
  const context = useContext(SequencerContext);
  if (context === undefined) {
    throw new Error('useSequencer must be used within a SequencerProvider');
  }
  return context;
}