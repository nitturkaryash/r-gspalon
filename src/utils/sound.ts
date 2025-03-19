/**
 * Utility for playing sound effects in the application
 */

// Cache for preloaded audio elements
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Preload a sound file for faster playback
 * @param soundName - The name of the sound file (without extension)
 * @param path - Optional custom path to the sound file
 */
export const preloadSound = (soundName: string, path?: string): void => {
  const soundPath = path || `/src/assets/sounds/${soundName}.mp3`;
  
  if (!audioCache[soundName]) {
    const audio = new Audio(soundPath);
    audio.load();
    audioCache[soundName] = audio;
  }
};

/**
 * Play a sound effect
 * @param soundName - The name of the sound file (without extension)
 * @param volume - Volume level from 0 to 1 (default: 0.5)
 * @param path - Optional custom path to the sound file
 */
export const playSound = (soundName: string, volume = 0.5, path?: string): void => {
  const soundPath = path || `/src/assets/sounds/${soundName}.mp3`;
  
  // Use cached audio if available, otherwise create a new one
  const audio = audioCache[soundName] || new Audio(soundPath);
  
  // Set volume
  audio.volume = volume;
  
  // Reset audio to beginning (in case it was played before)
  audio.currentTime = 0;
  
  // Play the sound
  audio.play().catch(error => {
    console.warn(`Failed to play sound "${soundName}":`, error);
  });
  
  // Cache the audio for future use if not already cached
  if (!audioCache[soundName]) {
    audioCache[soundName] = audio;
  }
}; 