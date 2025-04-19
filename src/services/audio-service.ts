export class AudioService {
  private audioContext: AudioContext | null = null;

  constructor() {
    console.log(this.constructor.name, "initialized");
  }

  public playLoopingAudio(): void {
    if (this.audioContext) return;

    this.audioContext = new AudioContext();
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    oscillator.frequency.value = 23000;
    gain.gain.value = 0.01;

    oscillator.connect(gain).connect(this.audioContext.destination);
    oscillator.start();

    console.log("Looping silent audio started");
  }
}
