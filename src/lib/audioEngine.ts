import { VoiceInstance, AudioEngineConfig } from './sequencerTypes';
import { generateId } from './noteUtils';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private voices: Map<string, VoiceInstance> = new Map();
  private isInitialized = false;

  constructor(config?: Partial<AudioEngineConfig>) {
    // Store config if needed for future use
    const audioConfig = {
      sampleRate: 44100,
      bufferSize: 256,
      maxPolyphony: 32,
      ...config
    };
    // Config stored but not currently used in implementation
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3; // Default master volume

      // Resume audio context if it's suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isInitialized = true;
      console.log('Audio Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Audio Engine:', error);
      throw error;
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Play a single note with ADSR envelope
   */
  async playNote(
    frequency: number, 
    velocity: number = 0.7, 
    duration?: number,
    waveform: OscillatorType = 'sine',
    envelope: { attack: number; decay: number; sustain: number; release: number } = {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.6,
      release: 0.5
    }
  ): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.audioContext || !this.masterGain) {
      throw new Error('Audio engine not initialized');
    }

    const now = this.audioContext.currentTime;
    const voiceId = generateId();

    // Create oscillator and gain nodes
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Configure oscillator
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, now);

    // Connect audio graph
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Apply ADSR envelope
    const attackTime = envelope.attack;
    const decayTime = envelope.decay;
    const sustainLevel = envelope.sustain * velocity;
    const releaseTime = envelope.release;

    // Attack phase
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(velocity, now + attackTime);

    // Decay phase
    gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);

    // Store voice instance
    const voice: VoiceInstance = {
      id: voiceId,
      oscillator,
      gainNode,
      note: '', // Will be set by caller if needed
      frequency,
      startTime: now
    };

    this.voices.set(voiceId, voice);

    // Start oscillator
    oscillator.start(now);

    // Handle note release
    if (duration) {
      // Automatic release after duration
      const releaseStartTime = now + duration;
      gainNode.gain.setValueAtTime(sustainLevel, releaseStartTime);
      gainNode.gain.linearRampToValueAtTime(0, releaseStartTime + releaseTime);
      
      oscillator.stop(releaseStartTime + releaseTime);
      
      // Clean up voice after it ends
      setTimeout(() => {
        this.voices.delete(voiceId);
      }, (duration + releaseTime) * 1000);
    }

    return voiceId;
  }

  /**
   * Stop a playing note
   */
  async stopNote(voiceId: string, releaseTime: number = 0.5): Promise<void> {
    const voice = this.voices.get(voiceId);
    if (!voice || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Apply release envelope
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.linearRampToValueAtTime(0, now + releaseTime);

    // Stop oscillator
    voice.oscillator.stop(now + releaseTime);

    // Clean up voice
    setTimeout(() => {
      this.voices.delete(voiceId);
    }, releaseTime * 1000);
  }

  /**
   * Stop all playing notes
   */
  async stopAllNotes(): Promise<void> {
    const stopPromises = Array.from(this.voices.keys()).map(voiceId => 
      this.stopNote(voiceId, 0.1)
    );
    await Promise.all(stopPromises);
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioContext!.currentTime);
    }
  }

  /**
   * Get current time in audio context
   */
  getCurrentTime(): number {
    return this.audioContext?.currentTime || 0;
  }

  /**
   * Schedule a note to play at a specific time
   */
  async scheduleNote(
    frequency: number,
    startTime: number,
    duration: number,
    velocity: number = 0.7,
    waveform: OscillatorType = 'sine'
  ): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.audioContext || !this.masterGain) {
      throw new Error('Audio engine not initialized');
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Configure oscillator
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    // Connect audio graph
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Apply envelope
    const attack = 0.01;
    const release = 0.1;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(velocity, startTime + attack);
    gainNode.gain.setValueAtTime(velocity, startTime + duration - release);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    // Schedule playback
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  /**
   * Get the number of active voices
   */
  getActiveVoiceCount(): number {
    return this.voices.size;
  }

  /**
   * Check if audio engine is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.audioContext?.state === 'running';
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAllNotes();
    this.voices.clear();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.audioContext = null;
    this.masterGain = null;
    this.isInitialized = false;
  }
}

// Global audio engine instance
export const audioEngine = new AudioEngine();