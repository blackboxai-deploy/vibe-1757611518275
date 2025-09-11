'use client';

import React, { useEffect, useCallback } from 'react';
import { useSequencer } from '@/hooks/useSequencer';
import { useAudioContext } from '@/hooks/useAudioContext';
import { Note } from '@/lib/sequencerTypes';
import { generateId, bpmToSeconds } from '@/lib/noteUtils';
import { Button } from '@/components/ui/button';

interface SequencerGridProps {
  className?: string;
}

export function SequencerGrid({ className = '' }: SequencerGridProps) {
  const { state, dispatch, getCurrentTrack } = useSequencer();
  const { playNote } = useAudioContext();

  const currentTrack = getCurrentTrack();
  const pattern = currentTrack?.pattern;

  // Available note options for the sequencer
  const availableNotes = [
    'C5', 'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4'
  ];

  // Get notes for a specific step and pitch
  const getNotesAtStep = useCallback((step: number, note: string): Note[] => {
    if (!pattern) return [];
    return pattern.notes.filter(n => n.step === step && n.note === note);
  }, [pattern]);

  // Toggle note at specific step and pitch
  const toggleNote = useCallback((step: number, note: string) => {
    if (!currentTrack) return;

    const existingNotes = getNotesAtStep(step, note);
    
    if (existingNotes.length > 0) {
      // Remove existing notes
      existingNotes.forEach(existingNote => {
        dispatch({
          type: 'REMOVE_NOTE',
          payload: { trackId: currentTrack.id, noteId: existingNote.id }
        });
      });
    } else {
      // Add new note
      const frequency = getNoteFrequency(note);
      const newNote: Note = {
        id: generateId(),
        note,
        frequency,
        velocity: 0.7,
        startTime: step * 0.25, // Quarter note steps
        duration: 0.25,
        step
      };

      dispatch({
        type: 'ADD_NOTE',
        payload: { trackId: currentTrack.id, note: newNote }
      });

      // Play note for immediate feedback
      playNote(frequency, 0.7, 0.2);
    }
  }, [currentTrack, getNotesAtStep, dispatch, playNote]);

  // Get frequency for note name
  const getNoteFrequency = (noteName: string): number => {
    const noteFrequencies: { [key: string]: number } = {
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
      'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
      'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
      'C5': 523.25
    };
    return noteFrequencies[noteName] || 440;
  };

  // Clear pattern
  const clearPattern = () => {
    if (currentTrack) {
      dispatch({ type: 'CLEAR_PATTERN', payload: currentTrack.id });
    }
  };

  // Playback engine - schedule notes
  useEffect(() => {
    if (!state.transport.isPlaying || !pattern) return;

    const stepDuration = bpmToSeconds(state.transport.bpm) / 4; // 16th note duration
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextStep = () => {
      const currentStep = state.transport.currentStep;
      
      // Play notes at current step
      const notesToPlay = pattern.notes.filter(note => note.step === currentStep);
      notesToPlay.forEach(note => {
        if (!currentTrack?.muted) {
          playNote(note.frequency, note.velocity * currentTrack.volume, 0.2, pattern.waveform);
        }
      });

      // Advance to next step
      const nextStep = state.transport.loop 
        ? (currentStep + 1) % pattern.length
        : currentStep + 1;

      if (!state.transport.loop && nextStep >= pattern.length) {
        // Stop at end if not looping
        dispatch({ type: 'SET_PLAYING', payload: false });
        dispatch({ type: 'SET_CURRENT_STEP', payload: 0 });
        return;
      }

      dispatch({ type: 'SET_CURRENT_STEP', payload: nextStep });

      // Schedule next step
      timeoutId = setTimeout(scheduleNextStep, stepDuration * 1000);
    };

    // Start playback
    timeoutId = setTimeout(scheduleNextStep, 0);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [state.transport.isPlaying, state.transport.currentStep, state.transport.bpm, state.transport.loop, pattern, currentTrack, dispatch, playNote]);

  if (!currentTrack || !pattern) {
    return (
      <div className={`bg-gray-800 p-6 rounded-lg shadow-lg ${className}`}>
        <p className="text-gray-400">No track selected</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 p-6 rounded-lg shadow-lg ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">
          Step Sequencer - {currentTrack.name}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearPattern}>
            Clear Pattern
          </Button>
        </div>
      </div>

      {/* Pattern Length Info */}
      <div className="mb-4 text-sm text-gray-400">
        Pattern Length: {pattern.length} steps | BPM: {pattern.bpm}
      </div>

      {/* Step Numbers */}
      <div className="mb-2">
        <div className="flex ml-16">
          {Array.from({ length: pattern.length }, (_, i) => (
            <div
              key={i}
              className={`w-8 h-6 flex items-center justify-center text-xs font-mono border-r border-gray-600 ${
                state.transport.currentStep === i ? 'bg-blue-600 text-white' : 'text-gray-400'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Sequencer Grid */}
      <div className="space-y-1">
        {availableNotes.map((note) => (
          <div key={note} className="flex items-center">
            {/* Note Label */}
            <div className="w-14 text-right text-sm font-mono text-gray-300 pr-2">
              {note}
            </div>

            {/* Step Buttons */}
            <div className="flex">
              {Array.from({ length: pattern.length }, (_, step) => {
                const hasNote = getNotesAtStep(step, note).length > 0;
                const isCurrentStep = state.transport.currentStep === step && state.transport.isPlaying;
                
                return (
                  <button
                    key={`${note}-${step}`}
                    className={`
                      w-8 h-8 border border-gray-600 transition-colors duration-100
                      ${hasNote 
                        ? 'bg-blue-500 hover:bg-blue-400' 
                        : 'bg-gray-700 hover:bg-gray-600'
                      }
                      ${isCurrentStep ? 'ring-2 ring-yellow-400' : ''}
                      ${step % 4 === 0 ? 'border-l-2 border-l-gray-400' : ''}
                    `}
                    onClick={() => toggleNote(step, note)}
                    title={`${note} - Step ${step + 1}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pattern Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-300 mb-1">Active Notes</div>
          <div className="text-white font-mono text-lg">
            {pattern.notes.length}
          </div>
        </div>

        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-300 mb-1">Pattern Density</div>
          <div className="text-white font-mono text-lg">
            {((pattern.notes.length / (pattern.length * availableNotes.length)) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-gray-700 rounded text-xs text-gray-400">
        <div className="font-medium mb-1">Instructions:</div>
        <div>Click grid cells to add/remove notes. Blue cells are active notes. Yellow outline shows current playback position.</div>
      </div>
    </div>
  );
}