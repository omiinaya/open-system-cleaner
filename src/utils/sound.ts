/**
 * Sound utility for playing notification sounds using Web Audio API
 * Generates simple sounds without requiring external audio files
 */

export type SoundType =
  | "scanComplete"
  | "issuesFound"
  | "optimizationComplete"
  | "success"
  | "warning"
  | "error";

/**
 * Play a sound effect
 * @param type - The type of sound to play
 * @param enabled - Whether sound is enabled (check this before calling)
 */
export const playSound = (type: SoundType, enabled: boolean = true): void => {
  if (!enabled) {
    return;
  }

  // Check if Web Audio API is available
  if (typeof window === "undefined" || !window.AudioContext) {
    return;
  }

  try {
    const audioContext = new AudioContext();

    // Create oscillator and gain nodes
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound based on type
    switch (type) {
      case "scanComplete":
        // Pleasant ascending chime
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(
          783.99,
          audioContext.currentTime + 0.1,
        ); // G5
        oscillator.frequency.exponentialRampToValueAtTime(
          1046.5,
          audioContext.currentTime + 0.2,
        ); // C6
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.4,
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
        break;

      case "issuesFound":
        // Alert sound - two quick beeps
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
        oscillator.frequency.setValueAtTime(
          440,
          audioContext.currentTime + 0.1,
        );
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3,
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;

      case "optimizationComplete":
        // Success fanfare
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(392.0, audioContext.currentTime); // G4
        oscillator.frequency.exponentialRampToValueAtTime(
          523.25,
          audioContext.currentTime + 0.15,
        ); // C5
        oscillator.frequency.exponentialRampToValueAtTime(
          659.25,
          audioContext.currentTime + 0.3,
        ); // E5
        oscillator.frequency.exponentialRampToValueAtTime(
          783.99,
          audioContext.currentTime + 0.45,
        ); // G5
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.6,
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.6);
        break;

      case "success":
        // Simple success ding
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
        oscillator.frequency.exponentialRampToValueAtTime(
          880.0,
          audioContext.currentTime + 0.1,
        ); // A5
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3,
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;

      case "warning":
        // Warning sound
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(330, audioContext.currentTime); // E4
        oscillator.frequency.setValueAtTime(
          330,
          audioContext.currentTime + 0.15,
        );
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.4,
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
        break;

      case "error":
        // Error sound
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
        oscillator.frequency.exponentialRampToValueAtTime(
          110,
          audioContext.currentTime + 0.2,
        );
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3,
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;

      default:
        // Default beep
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.2,
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }

    // Clean up after sound finishes
    setTimeout(() => {
      audioContext.close();
    }, 1000);
  } catch (error) {
    // Silently fail if audio cannot be played
    console.warn("Could not play sound:", error);
  }
};

/**
 * Check if sound effects are enabled
 * @returns true if sound effects should be played
 */
export const isSoundEnabled = (): boolean => {
  try {
    const { useSettingsStore } = require("../stores/settingsStore");
    const { notifications } = useSettingsStore.getState();
    return notifications.soundEnabled;
  } catch {
    return false;
  }
};

/**
 * Play a sound with automatic enabled check
 * @param type - The type of sound to play
 */
export const playSoundIfEnabled = (type: SoundType): void => {
  const enabled = isSoundEnabled();
  playSound(type, enabled);
};
