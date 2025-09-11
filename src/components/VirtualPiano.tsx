'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAudioContext } from '@/hooks/useAudioContext';
import { useSequencer } from '@/hooks/useSequencer';
import { generatePianoKeys, getWhiteKeys, getBlackKeys } from '@/lib/noteUtils';
import { Note } from '@/lib/sequencerTypes';
import { generateId } from '@/lib/noteUtils';

interface VirtualPianoProps {
  className?: string;
  startOctave?: number;
  endOctave?: number;
  onNotePlay?: (note: string, frequency: number) => void;
  recordingMode?: boolean;
}

export function VirtualPiano({ 
  className = '', 
  startOctave = 3, 
  endOctave = 6, 
  onNotePlay,
  recordingMode = false 
}: VirtualPianoProps) {
  const { playNote, stopNote, initializeAudio } = useAudioContext();
  const { state, addNoteToCurrentTrack } = useSequencer();
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [activeVoices, setActiveVoices] = useState<Map<string, string>>(new Map());

  const pianoKeys = generatePianoKeys(startOctave, endOctave);
  const whiteKeys = getWhiteKeys(pianoKeys);
  const blackKeys = getBlackKeys(pianoKeys);

  // Handle note press
  const handleNotePress = useCallback(async (note: string, frequency: number) => {
    if (pressedKeys.has(note)) return;

    try {
      // Initialize audio if needed
      await initializeAudio();

      // Play the note
      const voiceId = await playNote(
        frequency, 
        0.7, 
        undefined, // Sustained note
        state.audioSettings.waveform
      );

      // Update state
      setPressedKeys(prev => new Set(prev).add(note));
      setActiveVoices(prev => new Map(prev).set(note, voiceId));

      // Record note if in recording mode
      if (recordingMode && state.transport.isRecording) {
        const newNote: Note = {
          id: generateId(),
          note,
          frequency,
          velocity: 0.7,
          startTime: state.transport.currentStep,
          duration: 0.5, // Default duration
          step: state.transport.currentStep
        };
        addNoteToCurrentTrack(newNote);
      }

      // Callback for external handling
      onNotePlay?.(note, frequency);

      console.log(`Playing note: ${note} (${frequency.toFixed(2)}Hz)`);
    } catch (error) {
      console.error('Failed to play note:', error);
    }
  }, [playNote, initializeAudio, pressedKeys, state.audioSettings.waveform, recordingMode, state.transport.isRecording, state.transport.currentStep, addNoteToCurrentTrack, onNotePlay]);

  // Handle note release
  const handleNoteRelease = useCallback(async (note: string) => {
    if (!pressedKeys.has(note)) return;

    const voiceId = activeVoices.get(note);
    if (voiceId) {
      try {
        await stopNote(voiceId);
        console.log(`Stopped note: ${note}`);
      } catch (error) {
        console.error('Failed to stop note:', error);
      }
    }

    // Update state
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(note);
      return newSet;
    });

    setActiveVoices(prev => {
      const newMap = new Map(prev);
      newMap.delete(note);
      return newMap;
    });
  }, [pressedKeys, activeVoices, stopNote]);

  // Keyboard event handlers
  useEffect(() => {
    const keyMap: { [key: string]: string } = {
      // White keys (C major scale)
      'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4', 'g': 'G4', 'h': 'A4', 'j': 'B4', 'k': 'C5',
      // Black keys
      'w': 'C#4', 'e': 'D#4', 't': 'F#4', 'y': 'G#4', 'u': 'A#4', 'o': 'C#5'
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const note = keyMap[event.key.toLowerCase()];
      if (note && !event.repeat) {
        const keyData = pianoKeys.find(k => k.note === note);
        if (keyData) {
          handleNotePress(keyData.note, keyData.frequency);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const note = keyMap[event.key.toLowerCase()];
      if (note) {
        handleNoteRelease(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleNotePress, handleNoteRelease, pianoKeys]);

  // Get key styling based on state
  const getKeyClass = (note: string, isBlackKey: boolean) => {
    const isPressed = pressedKeys.has(note);
    const baseClass = isBlackKey
      ? 'absolute w-8 h-20 bg-gray-800 border border-gray-600 rounded-b-md'
      : 'w-12 h-32 bg-white border border-gray-300 rounded-b-md';

    const pressedClass = isBlackKey
      ? (isPressed ? 'bg-blue-600 shadow-inner' : 'hover:bg-gray-700')
      : (isPressed ? 'bg-blue-200 shadow-inner' : 'hover:bg-gray-100');

    return `${baseClass} ${pressedClass} transition-colors duration-100 cursor-pointer select-none shadow-sm`;
  };

  // Calculate black key position
  const getBlackKeyPosition = (note: string) => {
    const noteOnly = note.replace(/\d+$/, '');
    const octave = parseInt(note.match(/\d+$/)?.[0] || '0');
    const octaveIndex = octave - startOctave;
    
    const positions: { [key: string]: number } = {
      'C#': 8.5,
      'D#': 20,
      'F#': 44.5,
      'G#': 56,
      'A#': 67.5
    };

    const basePosition = positions[noteOnly] || 0;
    return basePosition + (octaveIndex * 84); // 84px per octave (12 white keys * 7px spacing)
  };

  return (
    <div className={`relative ${className}`}>
      {/* Piano Info */}
      <div className="mb-4 text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Virtual Piano</h2>
        <div className="text-sm text-gray-400">
          <p>Click keys or use keyboard: A-J for white keys, W-E-T-Y-U-O for black keys</p>
          {recordingMode && (
            <p className="text-red-400 font-medium">🔴 Recording Mode Active</p>
          )}
        </div>
      </div>

      {/* Piano Keyboard */}
      <div className="relative bg-gray-800 p-4 rounded-lg shadow-2xl">
        {/* White Keys */}
        <div className="flex gap-0.5">
          {whiteKeys.map((key) => (
            <button
              key={key.note}
              className={getKeyClass(key.note, false)}
              onMouseDown={() => handleNotePress(key.note, key.frequency)}
              onMouseUp={() => handleNoteRelease(key.note)}
              onMouseLeave={() => handleNoteRelease(key.note)}
              data-note={key.note}
            >
              <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                {key.note}
              </span>
            </button>
          ))}
        </div>

        {/* Black Keys */}
        <div className="absolute top-4">
          {blackKeys.map((key) => (
            <button
              key={key.note}
              className={getKeyClass(key.note, true)}
              style={{ left: `${getBlackKeyPosition(key.note)}px` }}
              onMouseDown={() => handleNotePress(key.note, key.frequency)}
              onMouseUp={() => handleNoteRelease(key.note)}
              onMouseLeave={() => handleNoteRelease(key.note)}
              data-note={key.note}
            >
              <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-300">
                {key.note}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Voice Count */}
      <div className="mt-2 text-center text-sm text-gray-400">
        Active Notes: {activeVoices.size}
      </div>
    </div>
  );
}