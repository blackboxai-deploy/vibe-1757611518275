'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { audioEngine } from '@/lib/audioEngine';

interface AudioContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initializeAudio: () => Promise<void>;
  playNote: (frequency: number, velocity?: number, duration?: number, waveform?: OscillatorType) => Promise<string>;
  stopNote: (voiceId: string) => Promise<void>;
  stopAllNotes: () => Promise<void>;
  setMasterVolume: (volume: number) => void;
  getActiveVoiceCount: () => number;
  isReady: () => boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeAudio = async () => {
    if (isInitialized || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await audioEngine.initialize();
      setIsInitialized(true);
      console.log('Audio context initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize audio';
      setError(errorMessage);
      console.error('Failed to initialize audio context:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const playNote = async (
    frequency: number, 
    velocity: number = 0.7, 
    duration?: number, 
    waveform: OscillatorType = 'sine'
  ): Promise<string> => {
    if (!isInitialized) {
      await initializeAudio();
    }
    return audioEngine.playNote(frequency, velocity, duration, waveform);
  };

  const stopNote = async (voiceId: string): Promise<void> => {
    return audioEngine.stopNote(voiceId);
  };

  const stopAllNotes = async (): Promise<void> => {
    return audioEngine.stopAllNotes();
  };

  const setMasterVolume = (volume: number): void => {
    audioEngine.setMasterVolume(volume);
  };

  const getActiveVoiceCount = (): number => {
    return audioEngine.getActiveVoiceCount();
  };

  const isReady = (): boolean => {
    return audioEngine.isReady();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioEngine.dispose();
    };
  }, []);

  const contextValue: AudioContextType = {
    isInitialized,
    isLoading,
    error,
    initializeAudio,
    playNote,
    stopNote,
    stopAllNotes,
    setMasterVolume,
    getActiveVoiceCount,
    isReady
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioContext(): AudioContextType {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
}