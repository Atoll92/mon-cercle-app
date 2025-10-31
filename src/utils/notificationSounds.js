/**
 * Notification Sound Utility
 *
 * Provides subtle sound notifications for chat and direct messages.
 * Sounds are generated programmatically using the Web Audio API to avoid
 * external dependencies and keep the bundle size small.
 */

// Cache for audio contexts to avoid creating multiple instances
let audioContext = null;

/**
 * Get or create the audio context
 * @returns {AudioContext} The audio context instance
 */
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Play a subtle notification sound
 * Generates a pleasant, non-intrusive tone using Web Audio API
 *
 * @param {string} type - The type of notification ('chat' or 'dm')
 * @returns {Promise<void>}
 */
export const playNotificationSound = async (type = 'chat') => {
  try {
    const context = getAudioContext();

    // Resume context if suspended (browser autoplay policy)
    if (context.state === 'suspended') {
      await context.resume();
    }

    // Create oscillator for the tone
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Different tones for chat vs DM
    if (type === 'chat') {
      // Chat: Higher, shorter tone (C6 note)
      oscillator.frequency.value = 1046.50;
      oscillator.type = 'sine';

      // Very subtle volume
      gainNode.gain.value = 0.1;

      // Quick fade out
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.1
      );

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.1);
    } else {
      // DM: Lower, slightly longer tone (A5 note) with a second harmonic
      const oscillator2 = context.createOscillator();
      const gainNode2 = context.createGain();

      oscillator.frequency.value = 880.00; // A5
      oscillator.type = 'sine';
      oscillator2.frequency.value = 1108.73; // C#6 (harmonic)
      oscillator2.type = 'sine';

      oscillator2.connect(gainNode2);
      gainNode2.connect(context.destination);

      // Very subtle volume
      gainNode.gain.value = 0.08;
      gainNode2.gain.value = 0.04; // Harmonic is quieter

      // Gentle fade out
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.15
      );
      gainNode2.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.15
      );

      oscillator.start(context.currentTime);
      oscillator2.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.15);
      oscillator2.stop(context.currentTime + 0.15);
    }
  } catch (error) {
    // Silently fail if audio isn't supported or user hasn't interacted yet
    console.debug('Could not play notification sound:', error.message);
  }
};

/**
 * Check if sound notifications should be played
 * @param {Object} profile - The user's profile object
 * @param {string} type - The type of notification ('chat' or 'dm')
 * @returns {boolean}
 */
export const shouldPlaySound = (profile, type) => {
  if (!profile) return false;

  if (type === 'chat') {
    return profile.sound_notifications_chat !== false;
  } else if (type === 'dm') {
    return profile.sound_notifications_dm !== false;
  }

  return false;
};

/**
 * Play notification sound if enabled for the user
 * @param {Object} profile - The user's profile object
 * @param {string} type - The type of notification ('chat' or 'dm')
 * @returns {Promise<void>}
 */
export const playNotificationIfEnabled = async (profile, type) => {
  if (shouldPlaySound(profile, type)) {
    await playNotificationSound(type);
  }
};

/**
 * Initialize audio context on user interaction
 * Call this on first user interaction to ensure sounds work
 * @returns {Promise<void>}
 */
export const initializeAudioContext = async () => {
  try {
    const context = getAudioContext();
    if (context.state === 'suspended') {
      await context.resume();
    }
  } catch (error) {
    console.debug('Could not initialize audio context:', error.message);
  }
};
