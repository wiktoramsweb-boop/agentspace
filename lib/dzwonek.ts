"use client";

/**
 * Sygnał zgłoszenia, czyli to, co słychać w słuchawce, zanim ktoś odbierze.
 *
 * Generujemy go z oscylatora, zamiast dołączać plik dźwiękowy. Trzy powody:
 * nie ciągniemy za sobą cudzego nagrania i jego licencji, nie dokładamy
 * kilobajtów do strony, a sygnał da się ustawić dokładnie tak, jak brzmi
 * w polskiej sieci: ton 425 Hz, sekunda dźwięku, cztery sekundy ciszy.
 *
 * Skracamy przerwę do dwóch sekund, bo połączenie wstaje w kilka sekund
 * i przy pełnej przerwie agent zdążyłby usłyszeć najwyżej jedno piknięcie.
 */

const CZESTOTLIWOSC_HZ = 425;
const DZWIEK_S = 1;
const CISZA_S = 2;

export class Dzwonek {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  /** Wywoływać wyłącznie z obsługi kliknięcia: przeglądarka inaczej nie pozwoli grać. */
  start() {
    if (this.ctx) return;
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    this.ctx = new Ctx();
    this.osc = this.ctx.createOscillator();
    this.gain = this.ctx.createGain();

    this.osc.type = "sine";
    this.osc.frequency.value = CZESTOTLIWOSC_HZ;
    this.osc.connect(this.gain);
    this.gain.connect(this.ctx.destination);

    // Obwiednia zamiast włączania i wyłączania oscylatora: twarde cięcie
    // sygnału słychać jako trzask.
    const teraz = this.ctx.currentTime;
    const okres = DZWIEK_S + CISZA_S;
    this.gain.gain.setValueAtTime(0, teraz);
    for (let i = 0; i < 40; i++) {
      const t = teraz + i * okres;
      this.gain.gain.setValueAtTime(0, t);
      this.gain.gain.linearRampToValueAtTime(0.09, t + 0.03);
      this.gain.gain.setValueAtTime(0.09, t + DZWIEK_S - 0.03);
      this.gain.gain.linearRampToValueAtTime(0, t + DZWIEK_S);
    }
    this.osc.start(teraz);
  }

  stop() {
    try {
      this.osc?.stop();
      this.ctx?.close();
    } catch {
      /* już zamknięty */
    }
    this.osc = null;
    this.gain = null;
    this.ctx = null;
  }
}
