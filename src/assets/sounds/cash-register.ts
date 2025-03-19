/**
 * Cash register sound functionality - DISABLED
 * This file is kept to maintain compatibility with imports but won't play any sound.
 */

/**
 * Silent placeholder for the cash register sound function
 * @param volume Ignored parameter
 * @returns Always resolves with true
 */
export const playCashRegisterSound = async (volume = 1.0): Promise<boolean> => {
  // Sound is now disabled - silently succeed without producing sound
  console.log('Cash register sound is disabled');
  return true;
};

/**
 * No-op function that doesn't add any test button
 */
export const addCashRegisterTestButton = (): void => {
  // This function is now disabled - does nothing
  return;
}; 