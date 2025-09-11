'use client';

import React, { useEffect } from 'react';
import { VirtualPiano } from '@/components/VirtualPiano';
import { TransportControls, useTransportKeyboardShortcuts } from '@/components/TransportControls';
import { SequencerGrid } from '@/components/SequencerGrid';
import { PatternManager } from '@/components/PatternManager';
import { useAudioContext } from '@/hooks/useAudioContext';
import { useSequencer } from '@/hooks/useSequencer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export default function DAWPage() {
  const { isInitialized, isLoading, error, initializeAudio, setMasterVolume } = useAudioContext();
  const { state, dispatch } = useSequencer();

  // Enable keyboard shortcuts
  useTransportKeyboardShortcuts();

  // Initialize audio on component mount
  useEffect(() => {
    // Don't auto-initialize to respect browser autoplay policies
    // User will click to initialize
  }, []);

  const handleMasterVolumeChange = (values: number[]) => {
    const volume = values[0];
    setMasterVolume(volume);
    dispatch({ type: 'SET_MASTER_VOLUME', payload: volume });
  };

  const handleWaveformChange = (waveform: OscillatorType) => {
    dispatch({ type: 'SET_WAVEFORM', payload: waveform });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Audio Error</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button onClick={initializeAudio}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Simple DAW</h1>
            <div className="flex items-center gap-4">
              {/* Audio Status */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isInitialized ? 'bg-green-500' : isLoading ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-300">
                  {isInitialized ? 'Audio Ready' : isLoading ? 'Initializing...' : 'Click to Start'}
                </span>
              </div>

              {/* Initialize Audio Button */}
              {!isInitialized && !isLoading && (
                <Button onClick={initializeAudio} size="sm">
                  Start Audio Engine
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Master Controls */}
        <div className="mb-6 bg-gray-800 p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Master Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Master Volume */}
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">
                Master Volume: {Math.round(state.audioSettings.masterVolume * 100)}%
              </label>
              <Slider
                value={[state.audioSettings.masterVolume]}
                onValueChange={handleMasterVolumeChange}
                min={0}
                max={1}
                step={0.01}
                disabled={!isInitialized}
              />
            </div>

            {/* Waveform Selection */}
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">
                Waveform
              </label>
              <div className="flex gap-1">
                {(['sine', 'square', 'sawtooth', 'triangle'] as OscillatorType[]).map((waveform) => (
                  <Button
                    key={waveform}
                    variant={state.audioSettings.waveform === waveform ? "default" : "secondary"}
                    size="sm"
                    onClick={() => handleWaveformChange(waveform)}
                    disabled={!isInitialized}
                    className="text-xs"
                  >
                    {waveform}
                  </Button>
                ))}
              </div>
            </div>

            {/* Track Info */}
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">
                Current Track
              </label>
              <div className="text-white">
                {state.tracks.find(t => t.id === state.currentTrackId)?.name || 'No Track'}
              </div>
            </div>
          </div>
        </div>

        {/* Main DAW Interface */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Transport and Piano */}
          <div className="xl:col-span-2 space-y-6">
            {/* Transport Controls */}
            <TransportControls />

            {/* Virtual Piano */}
            <VirtualPiano 
              recordingMode={state.transport.isRecording}
              onNotePlay={(note, frequency) => {
                console.log(`Piano played: ${note} (${frequency}Hz)`);
              }}
            />
          </div>

          {/* Right Column - Pattern Manager */}
          <div>
            <PatternManager />
          </div>
        </div>

        {/* Sequencer Grid - Full Width */}
        <div className="mt-6">
          <SequencerGrid />
        </div>

        {/* Instructions Panel */}
        <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold text-white mb-4">How to Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
            <div>
              <h3 className="font-medium text-white mb-2">Getting Started</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click "Start Audio Engine" to initialize audio</li>
                <li>Use the virtual piano to play notes</li>
                <li>Click "Record" then play piano to record into sequencer</li>
                <li>Press "Play" to hear your sequence loop</li>
                <li>Click sequencer grid cells to edit your pattern</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Keyboard Shortcuts</h3>
              <ul className="space-y-1">
                <li><span className="font-mono bg-gray-700 px-1 rounded">Space</span> - Play/Pause</li>
                <li><span className="font-mono bg-gray-700 px-1 rounded">R</span> - Record</li>
                <li><span className="font-mono bg-gray-700 px-1 rounded">S</span> - Stop</li>
                <li><span className="font-mono bg-gray-700 px-1 rounded">L</span> - Toggle Loop</li>
                <li><span className="font-mono bg-gray-700 px-1 rounded">A-J</span> - Piano white keys</li>
                <li><span className="font-mono bg-gray-700 px-1 rounded">W-E-T-Y-U-O</span> - Piano black keys</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center text-sm text-gray-400">
            Simple DAW - Built with Next.js, React, and Web Audio API
          </div>
        </div>
      </footer>
    </div>
  );
}