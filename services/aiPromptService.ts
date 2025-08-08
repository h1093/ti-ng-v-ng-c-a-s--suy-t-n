import { Character } from '../types';

// Omit the 'journal' and 'knownRecipeIds' as they are the biggest contributors to prompt size
// and are not essential for the AI to generate the next scene description.
// The RAG service handles relevant lore, and crafting is handled by player-initiated actions.
type PrunedCharacter = Omit<Character, 'journal' | 'knownRecipeIds'>;

/**
 * Creates a simplified version of the character object to send to the AI.
 * This prevents the prompt from becoming too large, which causes API errors.
 * The main culprit is the 'journal', which can grow indefinitely.
 * @param character The full character object.
 * @returns A pruned character object suitable for the AI prompt.
 */
export function createPrunedCharacterForAI(character: Character): PrunedCharacter {
    const { journal, knownRecipeIds, ...rest } = character;
    // The 'journal' and 'knownRecipeIds' are intentionally destructured out and not included in the returned 'rest' object.
    return rest;
}
