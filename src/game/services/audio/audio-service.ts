import { injectable } from "@needle-di/core";

@injectable()
export class AudioService {
  private readonly context: AudioContext;
  private musicBuffers: Map<string, AudioBuffer> = new Map();
  private sfxBuffers: Map<string, AudioBuffer> = new Map();
  private currentMusic: AudioBufferSourceNode | null = null;

  constructor() {
    this.context = new AudioContext();
  }

  public async loadMusic(name: string, url: string): Promise<void> {
    const buffer = await this.loadBuffer(url);
    this.musicBuffers.set(name, buffer);
  }

  public async loadSFX(name: string, url: string): Promise<void> {
    const buffer = await this.loadBuffer(url);
    this.sfxBuffers.set(name, buffer);
  }

  private async loadBuffer(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await this.context.decodeAudioData(arrayBuffer);
  }

  public playMusic(name: string, loop: boolean = true): void {
    const buffer = this.musicBuffers.get(name);
    if (!buffer) return;
    this.stopMusic();
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(this.context.destination);
    source.start(0);
    this.currentMusic = source;
  }

  public stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.disconnect();
      this.currentMusic = null;
    }
  }

  public playSFX(name: string): void {
    const buffer = this.sfxBuffers.get(name);
    if (!buffer) return;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start(0);
  }

  public resume(): void {
    if (this.context.state === "suspended") {
      void this.context.resume();
    }
  }
}
