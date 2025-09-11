'use client';

import React from 'react';
import { useSequencer } from '@/hooks/useSequencer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface TransportControlsProps {
  className?: string;
}

export function TransportControls({ className = '' }: TransportControlsProps) {
  const { state, dispatch, stop, togglePlayback, startRecording, stopRecording } = useSequencer();
  const { transport } = state;

  const handleBpmChange = (values: number[]) => {
    const newBpm = values[0];
    dispatch({ type: 'SET_BPM', payload: newBpm });
  };

  const handleLoopToggle = () => {
    dispatch({ type: 'SET_LOOP', payload: !transport.loop });
  };

  const handleRecord = () => {
    if (transport.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={`bg-gray-800 p-6 rounded-lg shadow-lg ${className}`}>
      <h2 className="text-lg font-semibold text-white mb-4">Transport Controls</h2>
      
      {/* Main Transport Buttons */}
      <div className="flex gap-3 mb-6">
        <Button
          variant={transport.isRecording ? "destructive" : "secondary"}
          size="lg"
          onClick={handleRecord}
          className="min-w-[100px]"
        >
          {transport.isRecording ? '⏹️ Stop Rec' : '⏺️ Record'}
        </Button>

        <Button
          variant={transport.isPlaying ? "default" : "secondary"}
          size="lg"
          onClick={togglePlayback}
          className="min-w-[100px]"
        >
          {transport.isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={stop}
          className="min-w-[100px]"
        >
          ⏹️ Stop
        </Button>

        <Button
          variant={transport.loop ? "default" : "secondary"}
          size="lg"
          onClick={handleLoopToggle}
          className="min-w-[100px]"
        >
          {transport.loop ? '🔁 Loop ON' : '🔁 Loop OFF'}
        </Button>
      </div>

      {/* BPM Control */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <label className="text-sm font-medium text-gray-300 min-w-[60px]">
            BPM: {transport.bpm}
          </label>
          <div className="flex-1">
            <Slider
              value={[transport.bpm]}
              onValueChange={handleBpmChange}
              min={60}
              max={200}
              step={1}
              className="flex-1"
            />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>60</span>
          <span>130 (House)</span>
          <span>200</span>
        </div>
      </div>

      {/* Playback Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-300 mb-1">Current Step</div>
          <div className="text-white font-mono text-lg">
            {transport.currentStep + 1}
          </div>
        </div>

        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-300 mb-1">Status</div>
          <div className="text-white font-medium">
            {transport.isRecording ? (
              <span className="text-red-400">🔴 Recording</span>
            ) : transport.isPlaying ? (
              <span className="text-green-400">▶️ Playing</span>
            ) : (
              <span className="text-gray-400">⏹️ Stopped</span>
            )}
          </div>
        </div>
      </div>

      {/* Pattern Length Selection */}
      <div className="mt-6">
        <label className="text-sm font-medium text-gray-300 block mb-2">
          Pattern Length
        </label>
        <div className="flex gap-2">
          {[8, 16, 32].map((length) => {
            const currentTrack = state.tracks.find(t => t.id === state.currentTrackId);
            const isActive = currentTrack?.pattern.length === length;
            
            return (
              <Button
                key={length}
                variant={isActive ? "default" : "secondary"}
                size="sm"
                onClick={() => {
                  if (state.currentTrackId) {
                    dispatch({ 
                      type: 'SET_PATTERN_LENGTH', 
                      payload: { trackId: state.currentTrackId, length } 
                    });
                  }
                }}
              >
                {length} steps
              </Button>
            );
          })}
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="mt-6 p-3 bg-gray-700 rounded text-xs text-gray-400">
        <div className="font-medium mb-1">Keyboard Shortcuts:</div>
        <div className="grid grid-cols-2 gap-1">
          <span>Space: Play/Pause</span>
          <span>R: Record</span>
          <span>S: Stop</span>
          <span>L: Toggle Loop</span>
        </div>
      </div>
    </div>
  );
}

// Keyboard shortcuts hook
export function useTransportKeyboardShortcuts(): void {
  const { togglePlayback, stop, startRecording, stopRecording, dispatch, state } = useSequencer();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault();
          togglePlayback();
          break;
        case 'r':
          event.preventDefault();
          if (state.transport.isRecording) {
            stopRecording();
          } else {
            startRecording();
          }
          break;
        case 's':
          event.preventDefault();
          stop();
          break;
        case 'l':
          event.preventDefault();
          dispatch({ type: 'SET_LOOP', payload: !state.transport.loop });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayback, stop, startRecording, stopRecording, dispatch, state.transport.loop, state.transport.isRecording]);
}