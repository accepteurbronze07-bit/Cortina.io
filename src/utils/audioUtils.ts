// Audio utilities for Gemini TTS voiceover, real synthesized .WAV background music (Phonk, Motivation, Suspense, Lofi), and .WAV sound effects (Whoosh, Impact, Cash)

export interface VoiceoverTrackResult {
  arrayBuffer: ArrayBuffer;
  blobUrl: string;
  audioBase64: string;
  voiceFileId?: string;
  voiceId?: string;
  voiceSpeed?: number;
  studioBassBoost?: boolean;
  cleanedText: string;
  durationSeconds: number;
  isGeminiTts: boolean;
}

// Nettoyage du script avant d'appeler l'API Speechma
export function cleanScript(rawScript: string): string {
  if (!rawScript) return '';
  return String(rawScript)
    .replace(/\n+/g, ' ')       // Remplace les retours à la ligne par un espace simple
    .replace(/\s+/g, ' ')       // Évite les doubles espaces
    .trim();
}

// Strips all timestamps [00:00-00:03], parentheses (...), brackets [...], Unicode emojis, spoken emoji descriptions, competitor view counts, and editing jargon ("clip 1", "seconde 15", etc.)
export function cleanScriptForSpeech(rawText: string): string {
  if (!rawText) return '';
  const rawScript = String(rawText);

  // Nettoyage du script avant d'appeler l'API Speechma
  const cleanInitial = rawScript
    .replace(/\n+/g, ' ')       // Remplace les retours à la ligne par un espace simple
    .replace(/\s+/g, ' ')       // Évite les doubles espaces
    .trim();

  return cleanInitial
    // 1. Remove anything inside square brackets: [00:00 - 00:03], [00:00-00:03], [Hook], [Cut], [0-3s]
    .replace(/\[[^\]]*\]/g, ' ')
    // 2. Remove anything inside parentheses: (Plan serré...), (Zoom rapide), (Cut sur la voiture), etc.
    .replace(/\([^)]*\)/g, ' ')
    // 3. Remove anything inside curly braces: {Pause}, {Effet sonore}
    .replace(/\{[^}]*\}/g, ' ')
    // 4. Remove ALL Unicode emojis, pictographs, dingbats, transport/map symbols, and variation selectors
    .replace(
      /\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu,
      ' '
    )
    // 5. Remove accidental text descriptions of emojis in FR/ES/EN
    .replace(
      /\b(?:cara\s+sonriendo(?:\s+con\s+ojos\s+de\s+coraz[oó]n)?|emoji\s+[a-zA-Z\u00C0-\u024F]+|visage\s+souriant(?:\s+avec\s+des\s+yeux\s+en\s+c[oœ]ur)?|smiling\s+face\s+with\s+heart[- ]eyes)\b/gi,
      ' '
    )
    // 6. Remove all time ranges AND standalone timestamps: 00:00 - 00:04, 00:00, 00:15, 00:42, 01:01
    .replace(/\b\d{1,2}:\d{2}(?:\s*[-–—àto/]+\s*\d{1,2}:\d{2})?\b/gi, ' ')
    // 7. Remove timestamp markers like 0s-4s, 15s-28s, "secondes 15 à 42", "à partir de la seconde 15"
    .replace(/\b\d{1,2}\s*s\s*[-–—àto/]+\s*\d{1,2}\s*s\b/gi, ' ')
    .replace(
      /\b(?:à\s+partir\s+de\s+(?:la\s+)?(?:seconde\s*\d+|quarante[- ]deux\s+secondes|quinze\s+secondes)|dès\s+la\s+quinzième\s+seconde|après\s+la\s+quarantième\s+seconde|entre\s+(?:15|quinze)\s+et\s+(?:42|quarante[- ]deux)\s+secondes|secondes?\s+\d+\s*(?:à|et|-|to)\s*\d+|a\s+partir\s+del\s+segundo\s+\d+|entre\s+el\s+segundo\s+\d+\s+y\s+(?:el\s+)?\d+|from\s+(?:fifteen|forty[- ]two|\d+)\s+seconds?\s+onward|after\s+the\s+forty[- ]second\s+mark)\b/gi,
      ' '
    )
    // 8. Remove references to "clip 1", "clip 2", "premier clip", "deuxième clip", "première vidéo", etc.
    .replace(
      /\b(?:(?:dans|sur|de|in|on)\s+(?:ce|le|la|cette|this|the)\s+)?(?:premier|deuxième|second|troisième|dernier|première|dernière|first|second|third|final|primer|segundo|tercer|último)?\s*(?:clip|vidéo|video|séquence)\s*(?:numéro\s*)?(?:\d+|one|two|three|un|deux|trois|uno|dos|tres)?\b/gi,
      (match) => {
        const lower = match.toLowerCase().trim();
        if (
          /clip/.test(lower) ||
          /(?:premier|deuxième|troisième|dernier|première|dernière|first|second|third|primer|segundo|tercer)\s+(?:clip|vidéo|video|séquence)/.test(
            lower
          ) ||
          /(?:clip|vidéo|video)\s*(?:\d+|one|two|three|un|deux|trois|uno|dos|tres)/.test(lower)
        ) {
          return ' ';
        }
        return match;
      }
    )
    // 9. Remove competitor view/like counts ("avec 1.1M de vues", "500k vues", "qui cumule déjà 150K vues")
    .replace(
      /\b(?:(?:avec|aux|qui\s+cumule(?:\s+déjà)?|with(?:\s+over)?|con(?:\s+más\s+de)?)\s+)?\d+(?:[.,]\d+)?\s*[kKmM]?\s*(?:de\s+|d['’])?(?:vues|views|vistas|reproducciones|likes|j['’]aime)\b/gi,
      ' '
    )
    // 10. Remove stage prefixes at start of lines like "Hook :", "Voix-off :", "Narrateur :", "Scène 1 :", "Acte 1 :"
    .replace(
      /(?:^|\n)\s*(?:hook|voix[\s-]?off|narrateur|narration|sc[eè]ne\s*\d*|acte\s*\d*|plan\s*\d*|intro|outro|cta)\s*[:\-–—]\s*/gi,
      ' '
    )
    // 11. Remove leftover leading dashes or colons or double commas
    .replace(/(?:^|\s)[-–—:]+\s+/g, ' ')
    .replace(/\s*,\s*,+/g, ',')
    .replace(/\s+([,.;!?])/g, '$1')
    // 12. Remove markdown formatting characters
    .replace(/[*#_~`]+/g, '')
    // 13. Collapse multiple spaces / newlines into single space
    .replace(/\n+/g, ' ')       // Remplace les retours à la ligne par un espace simple
    .replace(/\s+/g, ' ')       // Évite les doubles espaces
    .trim();
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize))
    );
  }
  return window.btoa(binary);
}

// Helper to write a 44-byte RIFF WAV header into a DataView for 24kHz 16-bit mono PCM
function writeWavHeader(view: DataView, numSamples: number, sampleRate: number = 24000) {
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);
}

// Deterministically pseudo-random noise for snare/hi-hat/whoosh synthesis
function pseudoNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

// ============================================================================
// Real .WAV Synthesizer for 10 Viral Background Music Styles
// (Storytelling Business & Cash, Satisfying ASMR, Phonk, Piano Émotion, Suspense, Motivation, Lofi, Dark Trap 808, Synthwave Cyber, Afro Chill)
// ============================================================================
export function generateMusicWavBuffer(
  styleId: string,
  durationSeconds: number = 10,
  volumeScale: number = 0.75
): ArrayBuffer {
  const sampleRate = 24000;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  writeWavHeader(view, numSamples, sampleRate);

  const normalizedStyle =
    styleId === 'cinematic'
      ? 'motivation'
      : styleId === 'lofi_tension'
      ? 'suspense'
      : styleId === 'vlog_upbeat'
      ? 'lofi'
      : styleId;

  const bpmMap: Record<string, number> = {
    business_cash: 114,
    satisfying_asmr: 96,
    phonk: 140,
    piano_emotion: 88,
    suspense: 108,
    motivation: 126,
    lofi: 92,
    trap_focus: 132,
    synthwave_cyber: 118,
    afro_chill: 104,
  };

  const bpm = bpmMap[normalizedStyle] || 110;
  const beatDur = 60 / bpm;
  const stepDur = beatDur / 2; // 8th notes
  const sixteenthDur = beatDur / 4; // 16th notes

  // Melodic & bass frequencies per style
  const cowbellPhonk = [587.33, 587.33, 698.46, 659.25, 587.33, 783.99, 698.46, 587.33]; // D5, F5, E5, G5
  const bassPhonk = [73.42, 73.42, 87.31, 82.41, 73.42, 65.41, 87.31, 73.42]; // D2, F2, E2, C2

  const businessPluckNotes = [293.66, 349.23, 440.0, 440.0, 261.63, 329.63, 392.0, 523.25]; // Dm -> C storytelling motif
  const businessBassNotes = [73.42, 73.42, 65.41, 65.41, 58.27, 58.27, 65.41, 73.42]; // D2 -> C2 -> Bb1 -> C2

  const asmrKalimbaNotes = [523.25, 659.25, 783.99, 987.77, 880.0, 783.99, 659.25, 587.33]; // Cmaj9 soothing droplets
  const pianoEmotionArp = [220.0, 261.63, 329.63, 440.0, 174.61, 220.0, 261.63, 349.23]; // Am -> Fmaj7 emotional piano
  const pianoBass = [110.0, 110.0, 87.31, 87.31, 130.81, 130.81, 98.0, 98.0]; // A2 -> F2 -> C3 -> G2

  const motivationArp = [261.63, 329.63, 392.0, 523.25, 293.66, 369.99, 440.0, 587.33]; // C major -> D major
  const motivationBass = [65.41, 65.41, 73.42, 73.42, 82.41, 82.41, 98.0, 98.0];

  const suspensePulse = [220.0, 233.08, 220.0, 196.0, 220.0, 261.63, 246.94, 220.0]; // A minor / Phrygian tension
  const suspenseBass = [55.0, 55.0, 58.27, 55.0, 49.0, 49.0, 55.0, 55.0];

  const synthwaveArp = [164.81, 246.94, 329.63, 392.0, 146.83, 220.0, 293.66, 369.99]; // Em -> D retro synth
  const afroPluck = [329.63, 392.0, 440.0, 392.0, 329.63, 293.66, 329.63, 261.63]; // Warm pentatonic groove
  const afroLogBass = [82.41, 82.41, 98.0, 73.42, 65.41, 65.41, 73.42, 82.41];

  const lofiChords = [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7
    [220.0, 261.63, 329.63, 392.0], // Am7
    [293.66, 349.23, 440.0, 523.25], // Dm7
    [196.0, 246.94, 293.66, 349.23], // G7
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beatIdx = Math.floor(t / beatDur);
    const beatTime = t % beatDur;
    const stepIdx = Math.floor(t / stepDur);
    const stepTime = t % stepDur;
    const sixteenthIdx = Math.floor(t / sixteenthDur);
    const sixteenthTime = t % sixteenthDur;

    let sample = 0;

    if (normalizedStyle === 'business_cash') {
      // Storytelling Business & Cash (Style Tapis / Métier rentable):
      // Warm deep sub-bass groove + hypnotic muted pluck + crisp rimshot/hat rhythm
      const kickFreq = 52 + 70 * Math.exp(-beatTime * 26);
      const isKickStep = stepIdx % 4 === 0 || stepIdx % 8 === 3;
      const kick = isKickStep
        ? Math.sin(2 * Math.PI * kickFreq * stepTime) * Math.exp(-stepTime * 8) * 0.5
        : 0;

      const pluckFreq = businessPluckNotes[stepIdx % businessPluckNotes.length];
      const pluckEnv = Math.exp(-stepTime * 11);
      const pluck =
        (Math.sin(2 * Math.PI * pluckFreq * t) * 0.7 +
          Math.sin(2 * Math.PI * (pluckFreq * 2) * t) * 0.25 +
          Math.sin(2 * Math.PI * (pluckFreq * 3) * t) * 0.1) *
        pluckEnv *
        0.38;

      const bassFreq = businessBassNotes[beatIdx % businessBassNotes.length];
      const bass = Math.tanh(Math.sin(2 * Math.PI * bassFreq * t) * 1.45) * 0.34;

      const isRim = beatIdx % 2 === 1 && beatTime < 0.08;
      const rim = isRim
        ? (Math.sin(2 * Math.PI * 420 * beatTime) * 0.5 + pseudoNoise(i) * 0.5) *
          Math.exp(-beatTime * 35) *
          0.26
        : 0;
      const hat =
        sixteenthTime < 0.025 ? pseudoNoise(i * 3) * Math.exp(-sixteenthTime * 75) * 0.12 : 0;

      sample = kick + pluck + bass + rim + hat;
    } else if (normalizedStyle === 'satisfying_asmr') {
      // Satisfying ASMR & Clean Chill: crystalline kalimba/marimba droplets + warm sub pad
      const kalimbaFreq = asmrKalimbaNotes[stepIdx % asmrKalimbaNotes.length];
      const kalimbaEnv = Math.exp(-stepTime * 9.5);
      const kalimba =
        (Math.sin(2 * Math.PI * kalimbaFreq * t) +
          0.35 * Math.sin(2 * Math.PI * (kalimbaFreq * 2.98) * t)) *
        kalimbaEnv *
        0.36;

      const shimmerFreq = asmrKalimbaNotes[(stepIdx + 2) % asmrKalimbaNotes.length] * 0.5;
      const warmPad =
        (Math.sin(2 * Math.PI * shimmerFreq * t) +
          0.5 * Math.sin(2 * Math.PI * (shimmerFreq * 1.5) * t)) *
        0.22;

      const softPulse =
        beatTime < 0.16
          ? Math.sin(2 * Math.PI * (62 + 30 * Math.exp(-beatTime * 20)) * beatTime) *
            Math.exp(-beatTime * 12) *
            0.3
          : 0;

      sample = kalimba + warmPad + softPulse;
    } else if (normalizedStyle === 'piano_emotion') {
      // Piano Émotion & Histoire Vraie: expressive minor piano arpeggio + warm cello sustain
      const pianoFreq = pianoEmotionArp[stepIdx % pianoEmotionArp.length];
      const pianoEnv = Math.exp(-stepTime * 5.2);
      const piano =
        (Math.sin(2 * Math.PI * pianoFreq * t) * 0.68 +
          Math.sin(2 * Math.PI * (pianoFreq * 2) * t) * 0.22 +
          Math.sin(2 * Math.PI * (pianoFreq * 3) * t) * 0.08 +
          Math.sin(2 * Math.PI * (pianoFreq * 4) * t) * 0.03) *
        pianoEnv *
        0.44;

      const celloFreq = pianoBass[Math.floor(beatIdx / 2) % pianoBass.length];
      const vibrato = Math.sin(2 * Math.PI * 5.0 * t) * 0.003;
      const cello =
        (Math.sin(2 * Math.PI * celloFreq * (1 + vibrato) * t) * 0.6 +
          Math.sin(2 * Math.PI * (celloFreq * 2) * (1 + vibrato) * t) * 0.25) *
        0.32;

      sample = piano + cello;
    } else if (normalizedStyle === 'synthwave_cyber') {
      // Synthwave Cyber Nocturne: 16th-note analog bassline + retro synth lead + punchy 80s kick/snare
      const kickFreq = 52 + 88 * Math.exp(-beatTime * 24);
      const kick = Math.sin(2 * Math.PI * kickFreq * t) * Math.exp(-beatTime * 6.5) * 0.48;

      const arpFreq = synthwaveArp[sixteenthIdx % synthwaveArp.length];
      const arpEnv = Math.exp(-sixteenthTime * 14);
      const sawApprox =
        Math.sin(2 * Math.PI * arpFreq * t) +
        0.5 * Math.sin(2 * Math.PI * (arpFreq * 2) * t) +
        0.25 * Math.sin(2 * Math.PI * (arpFreq * 3) * t);
      const synthLead = Math.tanh(sawApprox * 1.4) * arpEnv * 0.32;

      const isGatedSnare = beatIdx % 2 === 1 && beatTime < 0.16;
      const gatedSnare = isGatedSnare
        ? pseudoNoise(i) * Math.exp(-beatTime * 16) * 0.3
        : 0;

      sample = kick + synthLead + gatedSnare;
    } else if (normalizedStyle === 'afro_chill') {
      // Afro Chill & Rythme Doux: syncopated log-drum bass + warm tropical guitar pluck + shaker groove
      const logFreq = afroLogBass[stepIdx % afroLogBass.length];
      const isLogHit = stepIdx % 2 === 0 || stepIdx % 8 === 5;
      const logDrum = isLogHit
        ? Math.sin(2 * Math.PI * (logFreq + 45 * Math.exp(-stepTime * 28)) * t) *
          Math.exp(-stepTime * 7.5) *
          0.48
        : 0;

      const guitarFreq = afroPluck[stepIdx % afroPluck.length];
      const guitarEnv = Math.exp(-stepTime * 10);
      const guitar =
        (Math.sin(2 * Math.PI * guitarFreq * t) +
          0.4 * Math.sin(2 * Math.PI * (guitarFreq * 2) * t)) *
        guitarEnv *
        0.3;

      const shaker =
        sixteenthTime < 0.04 ? pseudoNoise(i * 2) * Math.exp(-sixteenthTime * 55) * 0.14 : 0;

      sample = logDrum + guitar + shaker;
    } else if (normalizedStyle === 'phonk') {
      // 1. Heavy 808 Sub-bass + Kick on every beat
      const kickFreq = 55 + 95 * Math.exp(-beatTime * 28);
      const kickEnv = Math.exp(-beatTime * 6.5);
      const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * 0.55;

      // 2. Signature Phonk distorted 808 Cowbell (two detuned square-like oscillators at 540Hz / 800Hz ratio)
      const noteFreq = cowbellPhonk[stepIdx % cowbellPhonk.length];
      const cbEnv = Math.exp(-stepTime * 14);
      const cbRaw =
        Math.sin(2 * Math.PI * noteFreq * t) +
        0.7 * Math.sin(2 * Math.PI * (noteFreq * 1.48) * t);
      const cowbell = Math.tanh(cbRaw * 2.2) * cbEnv * 0.35;

      // 3. Sub bassline
      const bassFreq = bassPhonk[beatIdx % bassPhonk.length];
      const bass = Math.tanh(Math.sin(2 * Math.PI * bassFreq * t) * 1.8) * 0.3;

      // 4. Crisp Snare on beats 1, 3 + Hi-hat on 8th steps
      const isSnare = beatIdx % 2 === 1 && beatTime < 0.14;
      const snare = isSnare ? pseudoNoise(i) * Math.exp(-beatTime * 22) * 0.35 : 0;
      const hat = stepTime < 0.04 ? pseudoNoise(i * 2) * Math.exp(-stepTime * 60) * 0.14 : 0;

      sample = kick + cowbell + bass + snare + hat;
    } else if (normalizedStyle === 'motivation') {
      // 1. Driving four-on-the-floor kick
      const kickFreq = 50 + 80 * Math.exp(-beatTime * 25);
      const kick = Math.sin(2 * Math.PI * kickFreq * t) * Math.exp(-beatTime * 7) * 0.48;

      // 2. Uplifting synth arpeggio (saw-like harmonics)
      const arpFreq = motivationArp[stepIdx % motivationArp.length];
      const arpEnv = Math.exp(-stepTime * 8);
      const arp =
        (Math.sin(2 * Math.PI * arpFreq * t) * 0.6 +
          Math.sin(2 * Math.PI * (arpFreq * 2) * t) * 0.3 +
          Math.sin(2 * Math.PI * (arpFreq * 3) * t) * 0.15) *
        arpEnv *
        0.38;

      // 3. Warm epic bass pad
      const bassFreq = motivationBass[beatIdx % motivationBass.length];
      const bass =
        (Math.sin(2 * Math.PI * bassFreq * t) +
          0.5 * Math.sin(2 * Math.PI * (bassFreq * 1.5) * t)) *
        0.28;

      sample = kick + arp + bass;
    } else if (normalizedStyle === 'suspense') {
      // 1. Deep heartbeat double-thump every 2 beats
      const barTime = t % (beatDur * 2);
      let heartbeat = 0;
      if (barTime < 0.18) {
        heartbeat = Math.sin(2 * Math.PI * 52 * barTime) * Math.exp(-barTime * 14) * 0.65;
      } else if (barTime >= 0.24 && barTime < 0.44) {
        const dt = barTime - 0.24;
        heartbeat = Math.sin(2 * Math.PI * 46 * dt) * Math.exp(-dt * 16) * 0.5;
      }

      // 2. Tense minor mystery pluck + clock tick
      const noteFreq = suspensePulse[stepIdx % suspensePulse.length];
      const pluckEnv = Math.exp(-stepTime * 10);
      const pluck =
        (Math.sin(2 * Math.PI * noteFreq * t) +
          0.4 * Math.sin(2 * Math.PI * (noteFreq * 2.01) * t)) *
        pluckEnv *
        0.32;

      // 3. Dark sub drone
      const droneFreq = suspenseBass[beatIdx % suspenseBass.length];
      const drone = Math.sin(2 * Math.PI * droneFreq * t) * 0.32;

      // 4. Subtle clock tick on every beat
      const tick = beatTime < 0.025 ? pseudoNoise(i) * Math.exp(-beatTime * 90) * 0.22 : 0;

      sample = heartbeat + pluck + drone + tick;
    } else if (normalizedStyle === 'trap_focus') {
      // Trap 808 + rapid hi-hat rolls
      const kickFreq = 48 + 90 * Math.exp(-beatTime * 26);
      const kick = Math.sin(2 * Math.PI * kickFreq * t) * Math.exp(-beatTime * 5.5) * 0.55;
      const hat =
        sixteenthTime < 0.03 ? pseudoNoise(i) * Math.exp(-sixteenthTime * 80) * 0.22 : 0;
      const bellFreq = suspensePulse[stepIdx % suspensePulse.length] * 2;
      const bell =
        Math.sin(2 * Math.PI * bellFreq * t) * Math.exp(-stepTime * 12) * 0.28;
      sample = kick + hat + bell;
    } else {
      // Lofi Chill & Narration: Rhodes electric piano chords + boom-bap groove
      const chordIdx = Math.floor(beatIdx / 2) % lofiChords.length;
      const chord = lofiChords[chordIdx];
      const vibrato = Math.sin(2 * Math.PI * 4.5 * t) * 0.003;
      let rhodes = 0;
      for (const f of chord) {
        rhodes += Math.sin(2 * Math.PI * f * (1 + vibrato) * t) * 0.16;
      }
      const chordEnv = 0.65 + 0.35 * Math.exp(-(t % (beatDur * 2)) * 2.2);
      rhodes *= chordEnv;

      // Soft lofi kick on beat 0 & snare on beat 1
      const isKick = beatIdx % 2 === 0 && beatTime < 0.18;
      const kick = isKick
        ? Math.sin(2 * Math.PI * (58 + 50 * Math.exp(-beatTime * 22)) * t) *
          Math.exp(-beatTime * 10) *
          0.45
        : 0;
      const isSnare = beatIdx % 2 === 1 && beatTime < 0.12;
      const snare = isSnare ? pseudoNoise(i) * Math.exp(-beatTime * 28) * 0.22 : 0;

      // Subtle vinyl crackle
      const vinyl = pseudoNoise(i) * 0.012;

      sample = rhodes + kick + snare + vinyl;
    }

    const clamped = Math.max(-1, Math.min(1, sample * volumeScale));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  }

  return buffer;
}

// ============================================================================
// Real .WAV Synthesizer for Sound Effects & Music Clips Catalog
// (Tendance, Music Clip, Amusant, Sifflements + Core SFX)
// ============================================================================
export type SfxType =
  | 'whoosh'
  | 'impact'
  | 'cash'
  | 'chaching'
  | 'ding'
  | 'pop'
  | 'click'
  // Tendance
  | 'bass_impact'
  | 'scene_switching'
  | 'stinger_camera_shutter'
  | 'rainy_night'
  | 'swish_whoosh_large'
  // Music Clip
  | 'orchestral_hit_sting'
  | 'impactful_epic_jingle'
  | 'orchestra_hit_lo_d'
  | 'music_effect_big_jaz'
  | 'orchestra_hit_jingle'
  // Amusant
  | 'cartoon_boing'
  | 'pop_bubble'
  | 'vinyl_scratch'
  | 'cash_register'
  | 'funny_quack'
  // Sifflements
  | 'slide_whistle_up'
  | 'slide_whistle_down'
  | 'referee_whistle'
  | 'wind_whistle'
  | 'wolf_whistle';

export function generateSfxWavBuffer(type: SfxType | string): ArrayBuffer {
  const sampleRate = 24000;

  const durationMap: Record<string, number> = {
    impact: 0.85,
    cash: 0.75,
    chaching: 0.75,
    whoosh: 0.5,
    ding: 0.6,
    pop: 0.22,
    click: 0.12,
    // Tendance
    bass_impact: 2.0,
    scene_switching: 3.0,
    stinger_camera_shutter: 1.1,
    rainy_night: 12.0, // 12s high-density rain + thunder ambiance (loops for 01:00)
    swish_whoosh_large: 1.2,
    // Music Clip
    orchestral_hit_sting: 7.0,
    impactful_epic_jingle: 7.0,
    orchestra_hit_lo_d: 4.0,
    music_effect_big_jaz: 5.0,
    orchestra_hit_jingle: 3.0,
    // Amusant
    cartoon_boing: 2.0,
    pop_bubble: 1.1,
    vinyl_scratch: 2.0,
    cash_register: 2.0,
    funny_quack: 1.2,
    // Sifflements
    slide_whistle_up: 2.0,
    slide_whistle_down: 2.0,
    referee_whistle: 1.2,
    wind_whistle: 4.0,
    wolf_whistle: 2.0,
  };

  const duration = durationMap[type] || 1.5;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  writeWavHeader(view, numSamples, sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (type === 'bass_impact' || type === 'impact') {
      // Deep 808/Cinema Sub-Bass Impact (00:02)
      const freq = 34 + 145 * Math.exp(-t * 16);
      const subBoom =
        Math.tanh(Math.sin(2 * Math.PI * freq * t) * 2.8) * Math.exp(-t * 2.1);
      const harmonic =
        Math.sin(2 * Math.PI * (freq * 2) * t) * Math.exp(-t * 4.5) * 0.35;
      const crack = t < 0.08 ? pseudoNoise(i) * Math.exp(-t * 38) * 0.75 : 0;
      sample = (subBoom * 0.82 + harmonic + crack) * 0.92;
    } else if (type === 'scene_switching') {
      // Scene Switching (00:03): Riser -> Dual Swoosh -> Crisp Lock Hit
      if (t < 1.2) {
        const p = t / 1.2;
        const riserFreq = 160 + 950 * p * p;
        sample =
          (Math.sin(2 * Math.PI * riserFreq * t * 0.35) * 0.45 +
            pseudoNoise(i) * 0.35 * p) *
          Math.sin(p * Math.PI);
      } else if (t < 2.2) {
        const dt = t - 1.2;
        const env = Math.sin((dt / 1.0) * Math.PI);
        const sweep = 240 + 1300 * env;
        sample =
          (Math.sin(2 * Math.PI * sweep * dt * 0.25) * 0.5 +
            pseudoNoise(i * 3) * 0.45) *
          env;
      } else {
        const dt = t - 2.2;
        const hitFreq = 65 + 180 * Math.exp(-dt * 24);
        sample =
          Math.tanh(Math.sin(2 * Math.PI * hitFreq * dt) * 2.2) *
          Math.exp(-dt * 5.5) *
          0.85;
      }
    } else if (type === 'stinger_camera_shutter') {
      // StingerCameraShutter (00:01): Mechanical double click + flash capacitor whine
      const click1 =
        t < 0.06 ? pseudoNoise(i) * Math.exp(-t * 55) * 0.9 : 0;
      const click2 =
        t >= 0.09 && t < 0.17
          ? pseudoNoise(i + 500) * Math.exp(-(t - 0.09) * 48) * 0.85
          : 0;
      const flashWhine =
        t >= 0.12
          ? Math.sin(2 * Math.PI * (1800 + 2200 * (1 - Math.exp(-(t - 0.12) * 4))) * t) *
            Math.exp(-(t - 0.12) * 3.8) *
            0.32
          : 0;
      sample = click1 + click2 + flashWhine;
    } else if (type === 'rainy_night') {
      // Rainy Night (01:00 ambiance): Textured rainfall + distant rolling thunder
      const rainNoise =
        (pseudoNoise(i) * 0.5 + pseudoNoise(i + 1) * 0.3 + pseudoNoise(i + 2) * 0.2) *
        0.28;
      // Distant thunder rumbles at t=1.2s and t=6.5s
      let thunder = 0;
      if (t > 1.0 && t < 4.8) {
        const dt = t - 1.0;
        const env = Math.sin((dt / 3.8) * Math.PI) * Math.exp(-dt * 0.5);
        thunder += Math.tanh(Math.sin(2 * Math.PI * (42 + 12 * Math.sin(dt * 5)) * dt) * 2.0) * env * 0.55;
      }
      if (t > 6.2 && t < 10.5) {
        const dt = t - 6.2;
        const env = Math.sin((dt / 4.3) * Math.PI) * Math.exp(-dt * 0.45);
        thunder += Math.tanh(Math.sin(2 * Math.PI * (38 + 10 * Math.cos(dt * 4)) * dt) * 2.1) * env * 0.5;
      }
      sample = rainNoise + thunder;
    } else if (type === 'swish_whoosh_large' || type === 'whoosh') {
      // Swish whoosh (large) (00:01)
      const env = Math.sin((t / duration) * Math.PI);
      const sweepFreq = 140 + 1650 * Math.pow(Math.sin((t / duration) * Math.PI), 1.4);
      const tone = Math.sin(2 * Math.PI * sweepFreq * t * 0.22) * 0.45;
      const air = (pseudoNoise(i) * 0.6 + pseudoNoise(i + 1) * 0.4) * 0.55;
      sample = (tone + air) * env * 0.88;
    } else if (type === 'orchestral_hit_sting') {
      // OrchestralHitSting 💎 (00:07): Dramatic C-minor orchestral brass + strings + timpani sting with long hall tail
      const chordFreqs = [130.81, 196.0, 261.63, 311.13, 392.0, 523.25]; // C3, G3, C4, Eb4, G4, C5
      const env = t < 0.08 ? t / 0.08 : Math.exp(-(t - 0.08) * 0.62);
      const vibrato = 1 + Math.sin(2 * Math.PI * 5.2 * t) * 0.004;
      let orch = 0;
      for (const f of chordFreqs) {
        orch +=
          (Math.sin(2 * Math.PI * f * vibrato * t) * 0.5 +
            Math.sin(2 * Math.PI * (f * 2) * vibrato * t) * 0.28 +
            Math.sin(2 * Math.PI * (f * 3) * t) * 0.14) *
          0.18;
      }
      const timpani =
        Math.sin(2 * Math.PI * (65.4 + 45 * Math.exp(-t * 12)) * t) *
        Math.exp(-t * 2.2) *
        0.5;
      const cymbal = t < 2.5 ? pseudoNoise(i) * Math.exp(-t * 1.8) * 0.22 : 0;
      sample = Math.tanh((orch * env + timpani + cymbal) * 1.4) * 0.85;
    } else if (type === 'impactful_epic_jingle') {
      // Impactful epic jingle (00:07): 4-chord heroic trailer brass progression
      const step = Math.min(3, Math.floor(t / 1.6));
      const localT = t - step * 1.6;
      const progressions = [
        [146.83, 220.0, 293.66, 349.23], // Dm
        [116.54, 174.61, 233.08, 293.66], // Bb
        [130.81, 196.0, 261.63, 329.63], // C
        [146.83, 220.0, 293.66, 440.0], // D5 finale
      ];
      const freqs = progressions[step];
      const env = step === 3 ? Math.exp(-localT * 0.75) : Math.exp(-localT * 1.35);
      let brass = 0;
      for (const f of freqs) {
        brass +=
          (Math.sin(2 * Math.PI * f * t) * 0.55 +
            Math.sin(2 * Math.PI * (f * 2) * t) * 0.3 +
            Math.sin(2 * Math.PI * (f * 3) * t) * 0.15) *
          0.22;
      }
      const boom =
        localT < 0.35
          ? Math.sin(2 * Math.PI * (55 + 60 * Math.exp(-localT * 18)) * localT) *
            Math.exp(-localT * 6) *
            0.45
          : 0;
      sample = Math.tanh((brass * env + boom) * 1.35) * 0.85;
    } else if (type === 'orchestra_hit_lo_d') {
      // Orchestra hit LO D (00:04): Powerful classic low D2/D3 sampler orchestra hit
      const dFreqs = [73.42, 146.83, 220.0, 293.66, 349.23, 440.0];
      const env = t < 0.04 ? t / 0.04 : Math.exp(-(t - 0.04) * 1.05);
      let hit = 0;
      for (const f of dFreqs) {
        hit +=
          (Math.sin(2 * Math.PI * f * t) * 0.6 +
            Math.sin(2 * Math.PI * (f * 2) * t) * 0.3) *
          0.2;
      }
      const punch = t < 0.12 ? pseudoNoise(i) * Math.exp(-t * 25) * 0.35 : 0;
      sample = Math.tanh((hit * env + punch) * 1.6) * 0.88;
    } else if (type === 'music_effect_big_jaz') {
      // MusicEffectBigJaz 💎 (00:05): Upbeat Big Band Jazz C13 brass stinger + walking bass + cymbal sizzle
      const jazzChord = [130.81, 246.94, 329.63, 392.0, 440.0, 587.33]; // Cmaj13
      const stabs = [0, 0.45, 0.95, 1.55];
      let brass = 0;
      for (let s = 0; s < stabs.length; s++) {
        const st = stabs[s];
        if (t >= st) {
          const dt = t - st;
          const isLast = s === stabs.length - 1;
          const decay = isLast ? 0.85 : 5.5;
          const env = Math.exp(-dt * decay);
          const slide = isLast ? 1 - 0.05 * Math.exp(-dt * 18) : 1;
          for (const f of jazzChord) {
            brass +=
              (Math.sin(2 * Math.PI * f * slide * dt) * 0.55 +
                Math.sin(2 * Math.PI * (f * 2 * slide) * dt) * 0.3) *
              env *
              0.14;
          }
        }
      }
      const rideCymbal =
        pseudoNoise(i) * Math.exp(-(t % 0.45) * 9) * (t < 3.8 ? 0.15 : 0.04);
      sample = Math.tanh((brass + rideCymbal) * 1.4) * 0.85;
    } else if (type === 'orchestra_hit_jingle') {
      // Orchestra hit jingle (00:03): Triple staccato orchestra hit fanfare
      const hits = [
        { start: 0.0, mul: 1.0 },
        { start: 0.28, mul: 1.122 },
        { start: 0.58, mul: 1.335 },
      ];
      const baseChord = [196.0, 293.66, 392.0, 493.88];
      for (let h = 0; h < hits.length; h++) {
        const { start, mul } = hits[h];
        if (t >= start) {
          const dt = t - start;
          const decay = h === 2 ? 1.4 : 7.0;
          const env = Math.exp(-dt * decay);
          for (const f of baseChord) {
            sample +=
              (Math.sin(2 * Math.PI * f * mul * dt) * 0.6 +
                Math.sin(2 * Math.PI * (f * 2 * mul) * dt) * 0.3) *
              env *
              0.18;
          }
        }
      }
      sample = Math.tanh(sample * 1.4) * 0.86;
    } else if (type === 'cartoon_boing') {
      // Cartoon Boing Jump (00:02)
      const env = Math.exp(-t * 2.2);
      const freq = 140 + 380 * Math.pow(t / duration, 0.7) + 65 * Math.sin(2 * Math.PI * 14 * t);
      sample =
        (Math.sin(2 * Math.PI * freq * t) * 0.7 +
          Math.sin(2 * Math.PI * (freq * 2) * t) * 0.25) *
        env *
        0.8;
    } else if (type === 'pop_bubble' || type === 'pop') {
      // Pop Bubble Ding (00:01)
      const freq = 280 + 720 * Math.min(1, t / 0.18);
      const popEnv = Math.exp(-t * 16);
      const chime =
        t >= 0.14
          ? Math.sin(2 * Math.PI * 1318.5 * (t - 0.14)) * Math.exp(-(t - 0.14) * 5) * 0.45
          : 0;
      sample = Math.sin(2 * Math.PI * freq * t) * popEnv * 0.75 + chime;
    } else if (type === 'vinyl_scratch') {
      // Vinyl Scratch Stop (00:02)
      const env = t < 1.5 ? 0.85 : Math.exp(-(t - 1.5) * 8);
      const pitchMod = 420 * (1 - 0.65 * (t / duration)) + 190 * Math.sin(2 * Math.PI * 6.5 * t);
      const tone = Math.tanh(Math.sin(2 * Math.PI * pitchMod * t) * 2.4) * 0.55;
      const grit = pseudoNoise(i) * 0.35;
      sample = (tone + grit) * env * 0.8;
    } else if (type === 'cash_register' || type === 'cash' || type === 'chaching') {
      // Classic metallic cash register bell + coin shimmer
      const notes = [1046.5, 1318.5, 2093.0, 2637.0];
      notes.forEach((freq, idx) => {
        const start = idx * 0.08;
        if (t >= start) {
          const dt = t - start;
          const env = Math.exp(-dt * 5.2);
          sample +=
            (Math.sin(2 * Math.PI * freq * dt) * 0.5 +
              Math.sin(2 * Math.PI * (freq * 2.41) * dt) * 0.25) *
            env *
            0.48;
        }
      });
    } else if (type === 'funny_quack') {
      // Funny Duck Quack (00:01)
      const quacks = [0, 0.38];
      for (const qs of quacks) {
        if (t >= qs && t < qs + 0.32) {
          const dt = t - qs;
          const env = Math.sin((dt / 0.32) * Math.PI);
          const f0 = 310 - 90 * (dt / 0.32);
          const nasal =
            Math.sin(2 * Math.PI * f0 * dt) * 0.4 +
            Math.sin(2 * Math.PI * (f0 * 3) * dt) * 0.45 +
            Math.sin(2 * Math.PI * (f0 * 5) * dt) * 0.25;
          sample += Math.tanh(nasal * 2.2) * env * 0.8;
        }
      }
    } else if (type === 'slide_whistle_up') {
      // Slide Whistle Up (00:02)
      const env = Math.sin((t / duration) * Math.PI);
      const phase = 2 * Math.PI * (420 * t + (750 * t * t) / duration);
      const breath = pseudoNoise(i) * 0.05;
      sample = (Math.sin(phase) * 0.82 + breath) * env * 0.8;
    } else if (type === 'slide_whistle_down') {
      // Slide Whistle Down (00:02)
      const env = Math.sin((t / duration) * Math.PI);
      const phase = 2 * Math.PI * (1850 * t - (720 * t * t) / duration);
      const breath = pseudoNoise(i) * 0.05;
      sample = (Math.sin(phase) * 0.82 + breath) * env * 0.8;
    } else if (type === 'referee_whistle') {
      // Referee Whistle Blast (00:01): 2800Hz + 2950Hz with 28Hz pea trill
      const env = t < 0.05 ? t / 0.05 : t > 0.85 ? Math.exp(-(t - 0.85) * 14) : 0.9;
      const trill = 0.65 + 0.35 * Math.sin(2 * Math.PI * 28 * t);
      const whistle =
        Math.sin(2 * Math.PI * 2780 * t) * 0.55 +
        Math.sin(2 * Math.PI * 2940 * t) * 0.35 +
        pseudoNoise(i) * 0.12;
      sample = whistle * trill * env * 0.8;
    } else if (type === 'wind_whistle') {
      // Wind Breeze Whistle (00:04)
      const env = Math.sin((t / duration) * Math.PI);
      const windFreq = 520 + 220 * Math.sin(2 * Math.PI * 0.45 * t);
      const howl = Math.sin(2 * Math.PI * windFreq * t) * 0.35;
      const air = (pseudoNoise(i) * 0.5 + pseudoNoise(i + 1) * 0.5) * 0.45;
      sample = (howl + air) * env * 0.82;
    } else if (type === 'wolf_whistle') {
      // Cartoon Wolf Whistle (00:02): two-part rising & swooping whistle
      if (t < 0.65) {
        const p = t / 0.65;
        const env = Math.sin(p * Math.PI);
        const phase = 2 * Math.PI * (550 * t + 900 * p * t);
        sample = Math.sin(phase) * env * 0.8;
      } else if (t >= 0.78) {
        const dt = t - 0.78;
        const dur2 = duration - 0.78;
        const p = dt / dur2;
        const env = Math.sin(p * Math.PI);
        const freq = 650 + 1150 * Math.sin(p * Math.PI);
        sample = Math.sin(2 * Math.PI * freq * dt * 0.55) * env * 0.82;
      }
    } else if (type === 'ding') {
      const env = Math.exp(-t * 6.5);
      sample =
        (Math.sin(2 * Math.PI * 1046.5 * t) * 0.65 +
          Math.sin(2 * Math.PI * 2093.0 * t) * 0.25) *
        env *
        0.75;
    } else {
      // click
      const env = Math.exp(-t * 65);
      sample = Math.sin(2 * Math.PI * 900 * t) * env * 0.45;
    }

    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  }

  return buffer;
}

// Creates a silent 24kHz 16-bit mono RIFF WAV buffer when "🚫 Aucun(e)" voice option is chosen
function createSilentWavBuffer(durationSeconds: number = 12): ArrayBuffer {
  const sampleRate = 24000;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  writeWavHeader(view, numSamples, sampleRate);
  return buffer;
}

// Creates a valid 24kHz 16-bit mono RIFF WAV buffer as fallback if Gemini TTS encounters a transient network error
function createFallbackWavBuffer(text: string, durationSeconds: number = 12): ArrayBuffer {
  const sampleRate = 24000;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  writeWavHeader(view, numSamples, sampleRate);

  const words = text.split(/\s+/).filter(Boolean);
  const wordDuration = durationSeconds / Math.max(1, words.length);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const wordIdx = Math.floor(t / wordDuration);
    const inWordPhase = (t % wordDuration) / wordDuration;
    const envelope = inWordPhase < 0.82 ? Math.sin((inWordPhase / 0.82) * Math.PI) : 0;
    const f0 = 135 + ((wordIdx * 29) % 45);
    const sig =
      (Math.sin(2 * Math.PI * f0 * t) * 0.5 +
        Math.sin(2 * Math.PI * (f0 * 2) * t) * 0.25 +
        Math.sin(2 * Math.PI * (f0 * 3) * t) * 0.12) *
      envelope *
      0.08;
    const sample = Math.max(-1, Math.min(1, sig));
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  return buffer;
}

class SoundController {
  private audioCtx: AudioContext | null = null;
  private musicPreviewAudio: HTMLAudioElement | null = null;
  private catalogSfxAudio: HTMLAudioElement | null = null;
  private voicePreviewAudio: HTMLAudioElement | null = null;
  private activePreviewRequestId: number = 0;
  private musicBlobCache: Map<string, string> = new Map();
  private sfxBlobCache: Map<string, string> = new Map();
  private elementGainMap: WeakMap<HTMLAudioElement, GainNode> = new WeakMap();

  public getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Applies 50% to 200% voice volume on any HTMLAudioElement:
  // Sets el.volume = Math.min(voiceVolume / 100, 1.0) AND uses a Web Audio API GainNode when > 100% (up to 2.0x gain)
  public applyElementVolumeWithWebAudioGain(
    audioEl: HTMLAudioElement | null | undefined,
    volumePercent: number = 130
  ) {
    if (!audioEl) return;
    const clampedPct = Number.isFinite(Number(volumePercent))
      ? Math.max(50, Math.min(200, Number(volumePercent)))
      : 130;
    const ratio = clampedPct / 100;

    // Standard HTMLAudioElement volume (0.0 to 1.0)
    audioEl.volume = Math.min(1.0, Math.max(0, ratio));

    // Web Audio API GainNode for >100% boost (or smooth adjustment when already connected)
    try {
      let gainNode = this.elementGainMap.get(audioEl);
      if (!gainNode && ratio > 1.0) {
        const ctx = this.getContext();
        const source = ctx.createMediaElementSource(audioEl);
        gainNode = ctx.createGain();
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        this.elementGainMap.set(audioEl, gainNode);
      }
      if (gainNode) {
        // When connected to WebAudio, keep el.volume = 1.0 and let gainNode control the exact 0.5x - 2.0x gain
        audioEl.volume = 1.0;
        gainNode.gain.value = ratio;
      }
    } catch {
      // Fallback if browser restricts MediaElementSource
    }
  }

  public setVoicePreviewVolume(volumePercent: number = 130) {
    if (this.voicePreviewAudio) {
      this.applyElementVolumeWithWebAudioGain(this.voicePreviewAudio, volumePercent);
    }
  }

  public stopVoicePreview() {
    this.activePreviewRequestId++;
    if (this.voicePreviewAudio) {
      try {
        this.voicePreviewAudio.pause();
        this.voicePreviewAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.voicePreviewAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  // Get or create a playable .WAV Blob URL for any background music style
  public getMusicWavBlobUrl(styleId: string, durationSeconds: number = 12): string {
    const cacheKey = `${styleId}_${durationSeconds}`;
    const existing = this.musicBlobCache.get(cacheKey);
    if (existing) return existing;

    const wavBuffer = generateMusicWavBuffer(styleId, durationSeconds, 0.78);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    this.musicBlobCache.set(cacheKey, url);
    return url;
  }

  // Get or create a playable .WAV Blob URL for any catalog SFX or Music Clip
  public getCatalogSfxWavBlobUrl(sfxKey: string): string {
    const existing = this.sfxBlobCache.get(sfxKey);
    if (existing) return existing;

    const wavBuf = generateSfxWavBuffer(sfxKey);
    const blob = new Blob([wavBuf], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    this.sfxBlobCache.set(sfxKey, url);
    return url;
  }

  // Play or pause a Catalog SFX / Music Clip preview in Step 3
  public async toggleCatalogSfxPreview(
    sfxKey: string,
    onEnded?: () => void
  ): Promise<boolean> {
    if (this.catalogSfxAudio && !this.catalogSfxAudio.paused) {
      this.catalogSfxAudio.pause();
      this.catalogSfxAudio.currentTime = 0;
    }

    const url = this.getCatalogSfxWavBlobUrl(sfxKey);
    const audio = new Audio(url);
    audio.volume = 0.85;
    audio.onended = () => {
      if (onEnded) onEnded();
    };
    this.catalogSfxAudio = audio;
    await audio.play();
    return true;
  }

  public stopCatalogSfxPreview() {
    if (this.catalogSfxAudio) {
      this.catalogSfxAudio.pause();
      this.catalogSfxAudio.currentTime = 0;
      this.catalogSfxAudio = null;
    }
  }

  // Download a Catalog SFX / Music Clip as a .WAV file via Blob URL without navigating the iframe
  public downloadCatalogSfxWav(sfxKey: string, clipName: string) {
    const url = this.getCatalogSfxWavBlobUrl(sfxKey);
    const safeFilename =
      clipName
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase() || sfxKey;
    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = url;
    anchor.download = `cortia-sfx-${safeFilename}.wav`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  // Play or pause background music preview in Step 3
  public async toggleMusicPreview(
    styleId: string,
    volumePercent: number = 35,
    onEnded?: () => void
  ): Promise<boolean> {
    if (this.musicPreviewAudio && !this.musicPreviewAudio.paused) {
      this.musicPreviewAudio.pause();
      this.musicPreviewAudio.currentTime = 0;
    }

    const url = this.getMusicWavBlobUrl(styleId, 10);
    const audio = new Audio(url);
    const safeVol = Number.isFinite(Number(volumePercent))
      ? Math.max(0, Math.min(100, Number(volumePercent)))
      : 22;
    audio.volume = safeVol / 100;
    audio.onended = () => {
      if (onEnded) onEnded();
    };
    this.musicPreviewAudio = audio;
    await audio.play();
    return true;
  }

  public setMusicPreviewVolume(volumePercent: number) {
    if (this.musicPreviewAudio) {
      const safeVol = Number.isFinite(Number(volumePercent))
        ? Math.max(0, Math.min(100, Number(volumePercent)))
        : 22;
      this.musicPreviewAudio.volume = safeVol / 100;
    }
  }

  public stopMusicPreview() {
    if (this.musicPreviewAudio) {
      this.musicPreviewAudio.pause();
      this.musicPreviewAudio.currentTime = 0;
      this.musicPreviewAudio = null;
    }
  }

  // Play a real .WAV sound effect (Whoosh, Impact, Cash, Ding, Pop, Click, or any Catalog SFX)
  playSfx(
    type: SfxType | string,
    targetNode?: AudioNode,
    targetCtx?: AudioContext
  ) {
    try {
      // 1. Play real .WAV via HTMLAudioElement so mobile and desktop speakers always output crystal-clear sound
      if (!targetNode) {
        const sfxUrl = this.getCatalogSfxWavBlobUrl(type);
        const sfxAudio = new Audio(sfxUrl);
        sfxAudio.volume = type === 'click' ? 0.35 : 0.78;
        sfxAudio.play().catch(() => {});
        return;
      }

      // 2. If a target WebAudio node is passed, decode and play into that node
      const ctx = targetCtx || this.getContext();
      const dest = targetNode || ctx.destination;
      const wavBuf = generateSfxWavBuffer(type);
      ctx.decodeAudioData(wavBuf.slice(0)).then((audioBuf) => {
        const src = ctx.createBufferSource();
        src.buffer = audioBuf;
        src.connect(dest);
        src.start();
      });
    } catch {
      // Ignore audio errors
    }
  }

  // Generate full ~60s voiceover from Speechma TTS API (/api/tts/speechma) with transparent local/neural TTS fallback
  async generateFullVoiceover(
    scriptText: string,
    geminiVoice: string,
    language: string = 'fr',
    characterStylePrompt?: string,
    voiceId?: string,
    voiceSpeed: number = 1.2,
    studioBassBoost: boolean = true
  ): Promise<VoiceoverTrackResult> {
    const rawScript = scriptText || '';
    // Nettoyage du script avant d'appeler l'API Speechma
    const cleanScriptText = rawScript
      .replace(/\n+/g, ' ')       // Remplace les retours à la ligne par un espace simple
      .replace(/\s+/g, ' ')       // Évite les doubles espaces
      .trim();

    const cleanedText = cleanScriptForSpeech(cleanScriptText);
    const estDuration = 61;
    const effectiveVoice = !geminiVoice || geminiVoice === 'NONE' ? 'Fenrir' : geminiVoice;
    const effectiveVoiceId = !voiceId || voiceId === 'voice_none' ? 'fr_leader_energique' : voiceId;
    const clampedSpeed = Math.max(0.8, Math.min(2.0, Number(voiceSpeed) || 1.2));
    const isBoostActive = studioBassBoost !== false;
    const boostTag = isBoostActive ? 'studioboost1' : 'studioboost0';
    const cacheKey = `${effectiveVoiceId}_${language}_${clampedSpeed}_${boostTag}_${cleanedText.slice(0, 30)}`;

    const endpointsToTry = ['/api/tts/speechma', '/api/generate-voice'];

    for (const endpoint of endpointsToTry) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: JSON.stringify({
            text: cleanedText,
            voiceName: effectiveVoice,
            voiceId: effectiveVoiceId,
            characterStylePrompt,
            language,
            voiceSpeed: clampedSpeed,
            studioBassBoost: isBoostActive,
            isFullScript: true,
            cacheKey,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.audioBase64) {
            const arrayBuffer = base64ToArrayBuffer(data.audioBase64);
            const mimeType = data.mimeType || 'audio/wav';
            const blob = new Blob([arrayBuffer], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);
            const durSec =
              Number(data.durationSeconds) > 4
                ? Number(data.durationSeconds)
                : Math.max(6, Math.round((arrayBuffer.byteLength - 44) / (24000 * 2)));
            return {
              arrayBuffer,
              blobUrl,
              audioBase64: data.audioBase64,
              voiceFileId: data.voiceFileId,
              voiceId: effectiveVoiceId,
              voiceSpeed: clampedSpeed,
              studioBassBoost: isBoostActive,
              cleanedText: data.cleanedText || cleanedText,
              durationSeconds: durSec,
              isGeminiTts: true,
            };
          }
        }
      } catch (err) {
        console.warn(`TTS endpoint ${endpoint} fallback triggered:`, err);
      }
    }

    const fallbackBuffer = createFallbackWavBuffer(cleanedText, estDuration);
    const blob = new Blob([fallbackBuffer], { type: 'audio/wav' });
    const blobUrl = URL.createObjectURL(blob);

    return {
      arrayBuffer: fallbackBuffer,
      blobUrl,
      audioBase64: arrayBufferToBase64(fallbackBuffer),
      voiceId: effectiveVoiceId,
      voiceSpeed: clampedSpeed,
      studioBassBoost: isBoostActive,
      cleanedText,
      durationSeconds: estDuration,
      isGeminiTts: false,
    };
  }

  // Schedule procedural background music into an AudioContext destination
  scheduleBackgroundMusic(
    ctx: AudioContext,
    dest: AudioNode,
    musicId: string,
    durationSeconds: number,
    volumePercent: number
  ) {
    const masterGain = ctx.createGain();
    const safePct = Number.isFinite(Number(volumePercent))
      ? Math.max(0, Math.min(100, Number(volumePercent)))
      : 22;
    const normalizedVol = (safePct / 100) * 0.7;
    masterGain.gain.setValueAtTime(normalizedVol, ctx.currentTime);
    masterGain.connect(dest);

    const wavBuffer = generateMusicWavBuffer(musicId, durationSeconds, 0.8);
    ctx
      .decodeAudioData(wavBuffer.slice(0))
      .then((decoded) => {
        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(masterGain);
        src.start();
      })
      .catch(() => {});

    return masterGain;
  }

  // Play preview sample of voice via Speechma TTS (/api/tts/speechma) with automatic fallback
  async playVoicePreview(
    text: string,
    geminiVoice: string,
    voiceName: string,
    rate: number = 1.2,
    pitch: number = 1.0,
    lang: string = 'fr',
    characterStylePrompt?: string,
    voiceId?: string,
    studioBassBoost: boolean = true,
    voiceVolume: number = 130
  ): Promise<void> {
    this.stopVoicePreview();

    if (geminiVoice === 'NONE' || voiceId === 'voice_none') {
      return;
    }

    const requestId = ++this.activePreviewRequestId;
    const effectiveVoiceId = voiceId || 'fr_leader_energique';
    const sampleText = cleanScriptForSpeech(
      text || `Bonjour, je suis la voix ${voiceName}. Idéale pour tes vidéos virales TikTok.`
    );
    const clampedRate = Math.max(0.8, Math.min(2.0, Number(rate) || 1.2));
    const isBoostActive = studioBassBoost !== false;
    const boostTag = isBoostActive ? 'studioboost1' : 'studioboost0';
    const cacheKey = `${effectiveVoiceId}_${lang}_${clampedRate}_${boostTag}_${sampleText.slice(0, 30)}`;

    const endpointsToTry = ['/api/tts/speechma', '/api/generate-voice'];

    for (const endpoint of endpointsToTry) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: JSON.stringify({
            text: sampleText,
            voiceName: geminiVoice,
            voiceId: effectiveVoiceId,
            characterStylePrompt,
            language: lang,
            voiceSpeed: clampedRate,
            studioBassBoost: isBoostActive,
            isFullScript: false,
            cacheKey,
          }),
        });

        if (requestId !== this.activePreviewRequestId) {
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (requestId !== this.activePreviewRequestId) {
            return;
          }
          const b64 = data.mp3Base64 || data.audioBase64;
          if (data.success && b64) {
            const arrayBuffer = base64ToArrayBuffer(b64);
            const mime = data.mp3Base64 ? 'audio/mpeg' : data.mimeType || 'audio/wav';
            const blob = new Blob([arrayBuffer], { type: mime });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            this.voicePreviewAudio = audio;
            audio.playbackRate = 1.0;
            this.applyElementVolumeWithWebAudioGain(audio, voiceVolume);
            audio.onended = () => {
              URL.revokeObjectURL(url);
              if (this.voicePreviewAudio === audio) {
                this.voicePreviewAudio = null;
              }
            };
            await audio.play();
            return;
          }
        }
      } catch {
        // Continue to next endpoint or browser SpeechSynthesis
      }
    }

    if (requestId !== this.activePreviewRequestId) {
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sampleText);
      utterance.rate = clampedRate;
      utterance.pitch = pitch;

      const langMap: Record<string, string> = {
        FR: 'fr-FR',
        EN: 'en-US',
        ES: 'es-ES',
        DE: 'de-DE',
        RU: 'ru-RU',
        AR: 'ar-SA',
        PT: 'pt-BR',
        PT_BR: 'pt-BR',
      };
      utterance.lang = langMap[lang.toUpperCase()] || 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  }
}

export const soundFx = new SoundController();
