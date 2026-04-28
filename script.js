
const body = document.body;
const gateScreen = document.getElementById("gateScreen");
const openGateBtn = document.getElementById("openGateBtn");
const soundToggle = document.getElementById("soundToggle");

const weddingDate = new Date("2030-10-21T20:00:00+05:30");

};

const shareBtn = document.getElementById("shareBtn");
const copyBtn = document.getElementById("copyBtn");
const copyStatus = document.getElementById("copyStatus");
const shareStatus = document.getElementById("shareStatus");

let audioContext;
let masterGain;
let musicLoopTimer = null;
let musicEnabled = false;
let nextMeasureTime = 0;

function ensureAudioContext() {
  if (audioContext) {
    return audioContext;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    if (soundToggle) {
      soundToggle.disabled = true;
      soundToggle.textContent = "Music Unavailable";
    }
    return null;
  }

  audioContext = new AudioContextClass();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.0001;
  masterGain.connect(audioContext.destination);
  return audioContext;
}

const invitationMessage = [
  "In the Name of Allah, the Most Gracious, the Most Merciful.",
  "Bismillah ir-Rahman ir-Rahim.",
  "Together with our families, we joyfully invite you to celebrate our blessed nikah with love and duas.",
].join("\n");

function openInvitation() {
function updateSoundToggle() {
  if (!soundToggle) {
    return;
  }

  soundToggle.textContent = musicEnabled ? "Music On" : "Music Off";
  soundToggle.setAttribute("aria-pressed", String(musicEnabled));
}

function playVoice(frequency, startAt, duration, type = "triangle", volume = 0.022) {
  if (!audioContext || !masterGain) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const voiceGain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(type === "sine" ? 850 : 1500, startAt);
  filter.Q.value = 0.6;

  oscillator.connect(filter);
  filter.connect(voiceGain);
  voiceGain.connect(masterGain);

  voiceGain.gain.setValueAtTime(0.0001, startAt);
  voiceGain.gain.exponentialRampToValueAtTime(volume, startAt + 0.05);
  voiceGain.gain.exponentialRampToValueAtTime(Math.max(volume * 0.58, 0.0001), startAt + duration * 0.62);
  voiceGain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.08);
}

function playRoyalGateChime() {
  const context = ensureAudioContext();

  if (!context) {
    return;
  }

  const startAt = context.currentTime + 0.02;

  masterGain.gain.cancelScheduledValues(startAt);
  masterGain.gain.setValueAtTime(masterGain.gain.value, startAt);
  masterGain.gain.linearRampToValueAtTime(0.075, startAt + 0.9);

  playVoice(261.63, startAt, 1.8, "sine", 0.017);
  playVoice(523.25, startAt + 0.02, 1.35, "triangle", 0.032);
  playVoice(659.25, startAt + 0.12, 1.3, "triangle", 0.025);
  playVoice(783.99, startAt + 0.24, 1.25, "triangle", 0.021);
}

function scheduleAmbientMeasure(startAt) {
  const melody = [293.66, 349.23, 392.0, 349.23, 329.63, 349.23, 440.0, 392.0];
  const bass = [146.83, 174.61, 196.0, 174.61];

  melody.forEach((frequency, index) => {
    playVoice(frequency, startAt + index * 0.6, 0.82, "triangle", 0.014);
  });

  bass.forEach((frequency, index) => {
    playVoice(frequency, startAt + index * 1.2, 1.65, "sine", 0.011);
  });

  playVoice(587.33, startAt + 1.8, 0.9, "triangle", 0.009);
}

async function startAmbientMusic() {
  const context = ensureAudioContext();

  if (!context || musicEnabled) {
    return;
  }

  if (context.state === "suspended") {
    await context.resume();
  }

  musicEnabled = true;
  updateSoundToggle();

  const startAt = context.currentTime + 0.12;
  nextMeasureTime = startAt;

  scheduleAmbientMeasure(nextMeasureTime);
  nextMeasureTime += 4.8;

  musicLoopTimer = window.setInterval(() => {
    if (!musicEnabled || !audioContext) {
      return;
    }

    const scheduleAheadTo = audioContext.currentTime + 5;

    while (nextMeasureTime < scheduleAheadTo) {
      scheduleAmbientMeasure(nextMeasureTime);
      nextMeasureTime += 4.8;
    }
  }, 1000);
}

function stopAmbientMusic() {
  if (!audioContext || !masterGain) {
    return;
  }

  musicEnabled = false;
  updateSoundToggle();

  if (musicLoopTimer) {
    window.clearInterval(musicLoopTimer);
    musicLoopTimer = null;
  }

  const now = audioContext.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value, now);
  masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
}

async function toggleMusic() {
  const context = ensureAudioContext();

  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    await context.resume();
  }

  if (musicEnabled) {
    stopAmbientMusic();
    return;
  }

  await startAmbientMusic();
  playRoyalGateChime();
}

async function copyInvitationText() {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(invitationMessage);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = invitationMessage;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  textArea.setSelectionRange(0, textArea.value.length);
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

async function openInvitation() {
  if (body.classList.contains("is-open")) {
    return;
  }

  const context = ensureAudioContext();

  if (context && context.state === "suspended") {
    try {
      await context.resume();
    } catch (error) {
      // Ignore resume issues and continue opening the invitation.
    }
  }

  body.classList.remove("gate-closed");
  body.classList.add("is-open");

    openGateBtn.disabled = true;
  }

  playRoyalGateChime();
  await startAmbientMusic();

  window.setTimeout(() => {
    if (gateScreen) {
      gateScreen.hidden = true;
  countdownNodes.minutes.textContent = String(remainingMinutes).padStart(2, "0");
}

async function copyInvitation() {
  if (!copyStatus) {
async function shareInvitation() {
  if (!shareStatus) {
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(invitationMessage);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = invitationMessage;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    copyStatus.textContent = "Invitation text copied. You can paste and send it anywhere.";
  } catch (error) {
    copyStatus.textContent = "Copy was blocked on this device. Please share the page directly.";
  }
}

async function shareInvitation() {
  if (!copyStatus) {
    return;
  }

  if (navigator.share) {
    try {
    if (navigator.share) {
      await navigator.share({
        title: "Mafaz Ramzan & Rishma Fernas Wedding Invitation",
        text: invitationMessage,
      });
      shareStatus.textContent = "Invitation ready to send beautifully to your loved ones.";
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
  }

  copyStatus.textContent = "Direct sharing is not available here, so the invitation text is ready to copy.";
  await copyInvitation();
  try {
    await copyInvitationText();
    shareStatus.textContent = "Sharing is not available here, so the invitation text was copied for you.";
  } catch (error) {
    shareStatus.textContent = "Sharing is unavailable on this device, but the page is ready to send directly.";
  }
}

setCountdown();
updateSoundToggle();
window.setInterval(setCountdown, 60000);

if (openGateBtn) {
  shareBtn.addEventListener("click", shareInvitation);
}

if (copyBtn) {
  copyBtn.addEventListener("click", copyInvitation);
if (soundToggle) {
  soundToggle.addEventListener("click", toggleMusic);
}
