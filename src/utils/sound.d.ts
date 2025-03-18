/**
 * Utility for playing sound effects in the application
 */
/**
 * Preload a sound file for faster playback
 * @param soundName - The name of the sound file (without extension)
 * @param path - Optional custom path to the sound file
 */
export declare const preloadSound: (soundName: string, path?: string) => void;
/**
 * Play a sound effect
 * @param soundName - The name of the sound file (without extension)
 * @param volume - Volume level from 0 to 1 (default: 0.5)
 * @param path - Optional custom path to the sound file
 */
export declare const playSound: (soundName: string, volume?: number, path?: string) => void;
