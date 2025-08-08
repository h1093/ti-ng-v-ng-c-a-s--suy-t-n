import { Character } from '../types';

// Omit the 'journal' and 'knownRecipeIds' as they are the biggest contributors to prompt size
// and are not essential for the AI to generate the next scene description.
// The RAG service handles relevant lore, and crafting is handled by player-initiated actions.
// The origin is also removed as it's static and its flavor is handled by RAG.
// We also prune masteries that haven't been progressed.
type PrunedCharacter = Omit<Character, 'journal' | 'knownRecipeIds' | 'origin'>;


/**
 * Creates a significantly simplified version of the character object to send to the AI.
 * This prevents the prompt from becoming too large, which causes API errors.
 * It removes static data like 'origin' and prunes un-leveled skills/proficiencies.
 * @param character The full character object.
 * @returns A heavily pruned character object suitable for the AI prompt.
 */
export function createPrunedCharacterForAI(character: Character): Partial<PrunedCharacter> {
    const {
        journal, // Omitted
        knownRecipeIds, // Omitted
        origin, // Omitted
        weaponProficiencies,
        magicMasteries,
        faith,
        specialSkills,
        ...rest
    } = character;

    // Prune proficiencies: only include those with progress.
    const relevantWeaponProficiencies = Object.entries(weaponProficiencies)
        .filter(([, prof]) => prof.level > 1 || prof.xp > 0)
        .reduce((acc, [key, value]) => {
            acc[key as keyof typeof weaponProficiencies] = value;
            return acc;
        }, {} as Character['weaponProficiencies']);

    // Prune masteries
    const relevantMagicMasteries = Object.entries(magicMasteries)
        .filter(([, prof]) => prof.level > 1 || prof.xp > 0)
        .reduce((acc, [key, value]) => {
            acc[key as keyof typeof magicMasteries] = value;
            return acc;
        }, {} as Character['magicMasteries']);
    
    // Prune faiths
    const relevantFaith = Object.entries(faith)
        .filter(([, f]) => f.markLevel > 0 || f.faithPoints > 0)
         .reduce((acc, [key, value]) => {
            acc[key as keyof typeof faith] = value;
            return acc;
        }, {} as Character['faith']);

    // Prune special skills
    const relevantSpecialSkills = Object.entries(specialSkills)
        .filter(([, prof]) => prof.unlocked)
        .reduce((acc, [key, value]) => {
            acc[key as keyof typeof specialSkills] = value;
            return acc;
        }, {} as Character['specialSkills']);

    const prunedCharacter: Partial<PrunedCharacter> = {
        ...rest,
    };

    // Only add the properties if they have content, to keep the prompt clean.
    if (Object.keys(relevantWeaponProficiencies).length > 0) {
        prunedCharacter.weaponProficiencies = relevantWeaponProficiencies;
    }
    if (Object.keys(relevantMagicMasteries).length > 0) {
        prunedCharacter.magicMasteries = relevantMagicMasteries;
    }
     if (Object.keys(relevantSpecialSkills).length > 0) {
        prunedCharacter.specialSkills = relevantSpecialSkills as Character['specialSkills'];
    }
    if (Object.keys(relevantFaith).length > 0) {
        prunedCharacter.faith = relevantFaith;
    }
    
    // The 'journal', 'knownRecipeIds', and 'origin' are intentionally not included.
    return prunedCharacter;
}