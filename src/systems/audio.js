export class CityAudio {
  constructor() {
    this.enabled = false;
    this.ctx = null;
  }
  async toggle() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.value = 0.11;
      this.master.connect(c.destination);
      this.engine = c.createOscillator();
      this.engine.type = "sawtooth";
      this.engineGain = c.createGain();
      this.engineGain.gain.value = 0;
      let filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 240;
      this.engine.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.master);
      this.engine.start();
      let buffer = c.createBuffer(1, c.sampleRate * 4, c.sampleRate),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * 0.15;
      let source = c.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      let low = c.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 330;
      source.connect(low);
      low.connect(this.master);
      source.start();
    }
    this.enabled = !this.enabled;
    await (this.enabled ? this.ctx.resume() : this.ctx.suspend());
    return this.enabled;
  }
  update(speed, driving) {
    if (!this.enabled) return;
    this.engine.frequency.setTargetAtTime(
      38 + Math.abs(speed) * 5,
      this.ctx.currentTime,
      0.2,
    );
    this.engineGain.gain.setTargetAtTime(
      driving ? 0.25 : 0,
      this.ctx.currentTime,
      0.2,
    );
  }
  horn() {
    if (!this.enabled) return;
    let o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.frequency.value = 410;
    o.type = "triangle";
    g.gain.value = 0.3;
    o.connect(g);
    g.connect(this.master);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    o.stop(this.ctx.currentTime + 0.27);
  }
}
