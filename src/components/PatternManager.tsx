'use client';

import React, { useState } from 'react';
import { useSequencer } from '@/hooks/useSequencer';
import { useAudioContext } from '@/hooks/useAudioContext';
import { Pattern } from '@/lib/sequencerTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PatternManagerProps {
  className?: string;
}

export function PatternManager({ className = '' }: PatternManagerProps) {
  const { state, savePattern, loadPattern, getCurrentTrack } = useSequencer();
  const { playNote } = useAudioContext();
  const [patternName, setPatternName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [previewingPattern, setPreviewingPattern] = useState<string | null>(null);

  const currentTrack = getCurrentTrack();

  const handleSavePattern = () => {
    if (!currentTrack || !patternName.trim()) return;

    savePattern(currentTrack.id, patternName.trim());
    setPatternName('');
    setShowSaveDialog(false);
  };

  const handleLoadPattern = (pattern: Pattern) => {
    if (!currentTrack) return;
    loadPattern(currentTrack.id, pattern);
  };

  const handlePreviewPattern = async (pattern: Pattern) => {
    if (previewingPattern === pattern.id) {
      setPreviewingPattern(null);
      return;
    }

    setPreviewingPattern(pattern.id);

    // Play first few notes of the pattern for preview
    const previewNotes = pattern.notes.slice(0, 8); // First 8 notes
    for (let i = 0; i < previewNotes.length; i++) {
      setTimeout(() => {
        const note = previewNotes[i];
        playNote(note.frequency, note.velocity * 0.5, 0.2, pattern.waveform);
      }, i * 150); // 150ms between notes
    }

    // Stop preview after 2 seconds
    setTimeout(() => {
      setPreviewingPattern(null);
    }, 2000);
  };



  const handleExportPattern = (pattern: Pattern) => {
    const dataStr = JSON.stringify(pattern, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pattern.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportPattern = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const pattern = JSON.parse(e.target?.result as string) as Pattern;
        if (currentTrack) {
          loadPattern(currentTrack.id, pattern);
        }
      } catch (error) {
        console.error('Failed to import pattern:', error);
        alert('Failed to import pattern. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`bg-gray-800 p-6 rounded-lg shadow-lg ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Pattern Manager</h2>
        <div className="flex gap-2">
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                Save Pattern
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Pattern</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter pattern name..."
                  value={patternName}
                  onChange={(e) => setPatternName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePattern()}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePattern} disabled={!patternName.trim()}>
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" asChild>
            <label>
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImportPattern}
                className="hidden"
              />
            </label>
          </Button>
        </div>
      </div>

      {/* Current Pattern Info */}
      {currentTrack && (
        <Card className="mb-4 bg-gray-700 border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-300">Current Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Name</div>
                <div className="text-white font-medium">{currentTrack.pattern.name}</div>
              </div>
              <div>
                <div className="text-gray-400">Notes</div>
                <div className="text-white font-medium">{currentTrack.pattern.notes.length}</div>
              </div>
              <div>
                <div className="text-gray-400">Length</div>
                <div className="text-white font-medium">{currentTrack.pattern.length} steps</div>
              </div>
              <div>
                <div className="text-gray-400">BPM</div>
                <div className="text-white font-medium">{currentTrack.pattern.bpm}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => handleExportPattern(currentTrack.pattern)}
            >
              Export Current
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pattern Library */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-300 mb-2">
          Saved Patterns ({state.patternLibrary.length})
        </h3>

        {state.patternLibrary.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No saved patterns yet.</p>
            <p className="text-sm mt-1">Create a pattern and save it to get started!</p>
          </div>
        ) : (
          state.patternLibrary.map((pattern) => (
            <Card key={pattern.id} className="bg-gray-700 border-gray-600">
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{pattern.name}</h4>
                    <div className="text-xs text-gray-400 mt-1">
                      {pattern.notes.length} notes • {pattern.length} steps • {pattern.bpm} BPM
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Created: {new Date(pattern.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewPattern(pattern)}
                      className="text-xs px-2 py-1"
                      disabled={previewingPattern !== null}
                    >
                      {previewingPattern === pattern.id ? '🔊' : '🎵'}
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleLoadPattern(pattern)}
                      className="text-xs px-2 py-1"
                    >
                      Load
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPattern(pattern)}
                      className="text-xs px-2 py-1"
                    >
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Storage Info */}
      <div className="mt-4 p-3 bg-gray-700 rounded text-xs text-gray-400">
        <div className="font-medium mb-1">Storage:</div>
        <div>Patterns are saved to your browser's local storage and will persist between sessions.</div>
      </div>
    </div>
  );
}