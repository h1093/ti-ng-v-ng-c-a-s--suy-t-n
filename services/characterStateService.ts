import type { Character, Scene, PlayerStats, Journal, Recipe, BodyPart, BodyPartStatus, WeaponProficiencyUpdate, Proficiency, MagicSchool, DeityName, FaithStatus, Sanctuary, Companion } from '../types';

export function applyStatChanges(currentStats: PlayerStats, statChanges: Partial<PlayerStats> | undefined): PlayerStats {
    if (!statChanges) return currentStats;
    const newStats = { ...currentStats };
    for (const [key, value] of Object.entries(statChanges)) {
        const statKey = key as keyof PlayerStats;
        newStats[statKey] = Math.max(0, (newStats[statKey] || 0) + value);
    }
    return newStats;
}

export function applyInventoryChanges(currentInventory: Record<string, number>, inventoryChanges: { itemName: string; quantity: number }[] | undefined): Record<string, number> {
    if (!inventoryChanges) return currentInventory;
    const newInventory = { ...currentInventory };
    for (const change of inventoryChanges) {
        newInventory[change.itemName] = (newInventory[change.itemName] || 0) + change.quantity;
        if (newInventory[change.itemName] <= 0) {
            delete newInventory[change.itemName];
        }
    }
    return newInventory;
}

export function applyBodyPartChanges(currentBodyParts: Record<BodyPart, BodyPartStatus>, bodyPartChanges: Partial<Record<BodyPart, BodyPartStatus>> | undefined): Record<BodyPart, BodyPartStatus> {
    if (!bodyPartChanges) return currentBodyParts;
    return { ...currentBodyParts, ...bodyPartChanges };
}

export function applyWeaponProficiencyUpdates(currentProficiencies: Record<string, Proficiency>, updates: WeaponProficiencyUpdate[] | undefined): Record<string, Proficiency> {
    if (!updates) return currentProficiencies;
    const newProficiencies = { ...currentProficiencies };
    for (const update of updates) {
        newProficiencies[update.name] = update.proficiency;
    }
    return newProficiencies;
}

export function applyMagicMasteryUpdates(currentMasteries: Record<MagicSchool, Proficiency>, updates: Partial<Record<MagicSchool, Proficiency>> | undefined): Record<MagicSchool, Proficiency> {
    if (!updates) return currentMasteries;
    return { ...currentMasteries, ...updates };
}

export function applyFaithUpdates(currentFaith: Record<DeityName, FaithStatus>, updates: Partial<Record<DeityName, FaithStatus>> | undefined): Record<DeityName, FaithStatus> {
    if (!updates) return currentFaith;
    return { ...currentFaith, ...updates };
}

export function applySanctuaryUpdate(currentSanctuary: Sanctuary | null, update: Sanctuary | undefined): Sanctuary | null {
    if (update === undefined) return currentSanctuary;
    return update;
}

export function applyJournalUpdates(currentJournal: Journal, journalUpdates: Partial<Journal> | undefined): { updatedJournal: Journal, wasUpdated: boolean } {
    if (!journalUpdates || Object.keys(journalUpdates).length === 0) {
        return { updatedJournal: currentJournal, wasUpdated: false };
    }

    const newJournal = { ...currentJournal };
    let wasUpdated = false;
    for (const key of Object.keys(journalUpdates) as (keyof Journal)[]) {
        const existingEntries = newJournal[key] || [];
        const newEntries = journalUpdates[key];
        if (newEntries && newEntries.length > 0) {
            const filteredNewEntries = newEntries.filter(
                (newEntry) => !existingEntries.some((existing) => existing.title === newEntry.title)
            );
            if (filteredNewEntries.length > 0) {
                newJournal[key] = [...existingEntries, ...filteredNewEntries];
                wasUpdated = true;
            }
        }
    }
    return { updatedJournal: newJournal, wasUpdated };
}

export function learnNewRecipes(currentKnownIds: string[], newlyLearnedRecipes: Recipe[] | undefined): { updatedIds: string[], learnedRecipeNames: string[] } {
    if (!newlyLearnedRecipes) {
        return { updatedIds: currentKnownIds, learnedRecipeNames: [] };
    }
    const newKnownIds = [...currentKnownIds];
    const learnedRecipeNames: string[] = [];
    for (const recipe of newlyLearnedRecipes) {
        if (!newKnownIds.includes(recipe.id)) {
            newKnownIds.push(recipe.id);
            learnedRecipeNames.push(recipe.name);
        }
    }
    return { updatedIds: newKnownIds, learnedRecipeNames };
}

export function assembleNotifications(
    scene: Scene, 
    newlyLearnedRecipeNames: string[], 
    journalWasUpdated: boolean
): string {
    const parts: string[] = [];

    if (scene.companionActionDescriptions && scene.companionActionDescriptions.length > 0) {
        scene.companionActionDescriptions.forEach(desc => parts.push(`[ ${desc} ]`));
    }

    if (journalWasUpdated) parts.push('[ Nhật ký đã được cập nhật. ]');
    
    if (newlyLearnedRecipeNames.length > 0) {
        newlyLearnedRecipeNames.forEach(name => parts.push(`[ Bạn đã học công thức mới: ${name} ]`));
    }
    
    // Add explicit notifications from the LLM
    if (scene.recipeLearnedNotification) parts.push(`[ ${scene.recipeLearnedNotification} ]`);
    if (scene.sanctuaryNotification) parts.push(`[ ${scene.sanctuaryNotification} ]`);
    if (scene.faithNotification) parts.push(`[ ${scene.faithNotification} ]`);
    if (scene.xpGains && scene.xpGains.length > 0) {
        scene.xpGains.forEach(gain => parts.push(`[ ${gain} ]`));
    }
    if (scene.levelupNotification) parts.push(`[ ${scene.levelupNotification} ]`);
    if (scene.skillLearnedNotification) parts.push(`[ ${scene.skillLearnedNotification} ]`);

    return parts.join('\n\n');
}

export function clampStats(stats: PlayerStats, hunger: number, thirst: number, maxHunger: number, maxThirst: number): { clampedStats: PlayerStats, clampedHunger: number, clampedThirst: number } {
    const clampedStats = { ...stats };
    clampedStats.hp = Math.min(stats.hp, stats.maxHp);
    clampedStats.san = Math.min(stats.san, stats.maxSan);
    clampedStats.mana = Math.min(stats.mana, stats.maxMana);
    clampedStats.stamina = Math.min(stats.stamina, stats.maxStamina);
    const clampedHunger = Math.min(hunger, maxHunger);
    const clampedThirst = Math.min(thirst, maxThirst);
    return { clampedStats, clampedHunger, clampedThirst };
}

export function applyGodMode(character: Character): Character {
    if (!character.godMode) return character;
    const charToUpdate = { ...character };
    charToUpdate.stats.hp = charToUpdate.stats.maxHp;
    charToUpdate.stats.san = charToUpdate.stats.maxSan;
    charToUpdate.stats.mana = charToUpdate.stats.maxMana;
    charToUpdate.stats.stamina = charToUpdate.stats.maxStamina;
    charToUpdate.hunger = charToUpdate.maxHunger;
    charToUpdate.thirst = charToUpdate.maxThirst;
    return charToUpdate;
}