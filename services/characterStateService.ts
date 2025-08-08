import { Character, Scene, InventoryChange, BodyPart, BodyPartStatus, CharacterStats, Proficiency, FaithStatus, Sanctuary, Journal, Recipe, Skill } from '../types';

function applyStatChanges(currentStats: CharacterStats, statChanges?: Partial<CharacterStats>): CharacterStats {
    if (!statChanges) return currentStats;
    const newStats = { ...currentStats };
    for (const [key, value] of Object.entries(statChanges)) {
        if (value !== undefined) {
            const statKey = key as keyof CharacterStats;
            newStats[statKey] = Math.max(0, (newStats[statKey] || 0) + value);
        }
    }
    return newStats;
}

function applyInventoryChanges(currentInventory: Record<string, number>, inventoryChanges?: InventoryChange[]): Record<string, number> {
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

function applyBodyPartChanges(currentBodyParts: Record<BodyPart, BodyPartStatus>, bodyPartChanges?: Partial<Record<BodyPart, BodyPartStatus>>): Record<BodyPart, BodyPartStatus> {
    if (!bodyPartChanges) return currentBodyParts;
    return { ...currentBodyParts, ...bodyPartChanges };
}

function applyWeaponProficiencyUpdates(currentProficiencies: Record<string, Proficiency>, updates?: { name: string, proficiency: Proficiency }[]): Record<string, Proficiency> {
    if (!updates) return currentProficiencies;
    const newProficiencies = { ...currentProficiencies };
    for (const update of updates) {
        newProficiencies[update.name] = update.proficiency;
    }
    return newProficiencies;
}

function applyMagicMasteryUpdates(currentMasteries: Record<string, Proficiency>, updates?: { name: string, proficiency: Proficiency }[]): Record<string, Proficiency> {
    if (!updates) return currentMasteries;
    const newMasteries = { ...currentMasteries };
     for (const update of updates) {
        if (update.name && update.proficiency) {
            newMasteries[update.name] = update.proficiency;
        }
    }
    return newMasteries;
}

function applySpecialSkillUpdates(currentSpecialSkills: Character['specialSkills'], updates?: Partial<Character['specialSkills']>): Character['specialSkills'] {
    if (!updates) return currentSpecialSkills;
    const newSpecialSkills = { ...currentSpecialSkills };
    for (const [key, value] of Object.entries(updates)) {
        const skillKey = key as keyof Character['specialSkills'];
        if (newSpecialSkills[skillKey] && value) {
            newSpecialSkills[skillKey] = { ...newSpecialSkills[skillKey], ...value };
        }
    }
    return newSpecialSkills;
}


function applyFaithUpdates(currentFaith: Record<string, FaithStatus>, updates?: { name: string, status: FaithStatus }[]): Record<string, FaithStatus> {
    if (!updates) return currentFaith;
    const newFaith = { ...currentFaith };
    for (const update of updates) {
        if (update.name && update.status) {
            newFaith[update.name] = update.status;
        }
    }
    return newFaith;
}

function applySanctuaryUpdate(currentSanctuary: Sanctuary | null, update?: Sanctuary): Sanctuary | null {
    if (update === undefined) return currentSanctuary;
    return update;
}

function applyJournalUpdates(currentJournal: Journal, journalUpdates?: Partial<Journal>): { updatedJournal: Journal, wasUpdated: boolean } {
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


function learnNewRecipes(currentKnownIds: string[], newlyLearnedRecipes?: Recipe[]): { updatedIds: string[], learnedRecipeNames: string[] } {
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

function assembleNotifications(
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
    
    if (scene.recipeLearnedNotification) parts.push(`[ ${scene.recipeLearnedNotification} ]`);
    if (scene.sanctuaryNotification) parts.push(`[ ${scene.sanctuaryNotification} ]`);
    if (scene.faithNotification) parts.push(`[ ${scene.faithNotification} ]`);
    if (scene.xpGains && scene.xpGains.length > 0) {
        scene.xpGains.forEach(gain => parts.push(`[ ${gain} ]`));
    }
    if (scene.levelupNotification) parts.push(`[ ${scene.levelupNotification} ]`);
    if (scene.skillLearnedNotification) parts.push(`[ ${scene.skillLearnedNotification} ]`);
    if (scene.specialSkillLearnedNotification) parts.push(`[ ${scene.specialSkillLearnedNotification} ]`);

    return parts.join('\n\n');
}

function clampStats(stats: CharacterStats, hunger: number, thirst: number, maxHunger: number, maxThirst: number) {
    const clampedStats = { ...stats };
    clampedStats.hp = Math.min(stats.hp, stats.maxHp);
    clampedStats.san = Math.min(stats.san, stats.maxSan);
    clampedStats.mana = Math.min(stats.mana, stats.maxMana);
    clampedStats.stamina = Math.min(stats.stamina, stats.maxStamina);
    const clampedHunger = Math.min(hunger, maxHunger);
    const clampedThirst = Math.min(thirst, maxThirst);
    return { clampedStats, clampedHunger, clampedThirst };
}

function applyGodMode(character: Character): Character {
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


export function processScene(scene: Scene, currentCharacter: Character): { updatedCharacter: Character, finalScene: Scene } {
    if (!scene || !currentCharacter) {
        throw new Error("ProcessScene called with invalid scene or character");
    }

    let charToUpdate = { ...currentCharacter };

    if (scene.updatedCompanions) {
      charToUpdate.companions = scene.updatedCompanions;
    }

    charToUpdate.stats = applyStatChanges(charToUpdate.stats, scene.statChanges);
    charToUpdate.inventory = applyInventoryChanges(charToUpdate.inventory, scene.inventoryChanges);
    charToUpdate.bodyParts = applyBodyPartChanges(charToUpdate.bodyParts, scene.bodyPartChanges);
    charToUpdate.weaponProficiencies = applyWeaponProficiencyUpdates(charToUpdate.weaponProficiencies, scene.updatedWeaponProficiencies);
    charToUpdate.magicMasteries = applyMagicMasteryUpdates(charToUpdate.magicMasteries, scene.updatedMagicMasteries);
    charToUpdate.specialSkills = applySpecialSkillUpdates(charToUpdate.specialSkills, scene.updatedSpecialSkills);
    charToUpdate.faith = applyFaithUpdates(charToUpdate.faith, scene.updatedFaith);
    charToUpdate.sanctuary = applySanctuaryUpdate(charToUpdate.sanctuary, scene.updatedSanctuary);

    if (scene.updatedSkills) {
        // This logic handles both learning new skills and updating existing ones (like for cooldowns).
        const newSkillsList = [...charToUpdate.skills];
        scene.updatedSkills.forEach(skillUpdate => {
            const existingSkillIndex = newSkillsList.findIndex(s => s.id === skillUpdate.id);
            if (existingSkillIndex > -1) {
                // Update existing skill
                newSkillsList[existingSkillIndex] = skillUpdate;
            } else {
                // Add new skill
                newSkillsList.push(skillUpdate);
            }
        });
        charToUpdate.skills = newSkillsList;
    }

    const { updatedIds, learnedRecipeNames } = learnNewRecipes(charToUpdate.knownRecipeIds, scene.newlyLearnedRecipes);
    charToUpdate.knownRecipeIds = updatedIds;
    
    const { updatedJournal, wasUpdated: journalWasUpdated } = applyJournalUpdates(charToUpdate.journal, scene.journalUpdates);
    if (journalWasUpdated) {
        charToUpdate.journal = updatedJournal;
    }
    
    if (scene.tamingResult?.success && scene.tamingResult.companion) {
        charToUpdate.companions = [...charToUpdate.companions, scene.tamingResult.companion];
    }
    if (scene.reanimationResult?.success && scene.reanimationResult.companion) {
        charToUpdate.companions = [...charToUpdate.companions, scene.reanimationResult.companion];
    }

    let notificationText = assembleNotifications(scene, learnedRecipeNames, journalWasUpdated);
    
    if (scene.tamingResult) {
        const tamingNotif = scene.tamingResult.success
            ? `[ Bạn đã thuần hóa thành công ${scene.tamingResult.creatureName}! Nó đã gia nhập đội của bạn. ]`
            : `[ Thuần hóa ${scene.tamingResult.creatureName} thất bại. ]`;
        notificationText = `${tamingNotif}\n\n${notificationText}`;
    }

    if (scene.reanimationResult) {
        const reanimationNotif = `[ ${scene.reanimationResult.message} ]`;
        notificationText = `${reanimationNotif}\n\n${notificationText}`;
    }
    
    const sceneDescription = notificationText ? `${notificationText.trim()}\n\n${scene.description}` : scene.description;

    const { clampedStats, clampedHunger, clampedThirst } = clampStats(charToUpdate.stats, charToUpdate.hunger, charToUpdate.thirst, charToUpdate.maxHunger, charToUpdate.maxThirst);
    charToUpdate.stats = clampedStats;
    charToUpdate.hunger = clampedHunger;
    charToUpdate.thirst = clampedThirst;

    charToUpdate = applyGodMode(charToUpdate);

    const finalScene: Scene = { ...scene, description: sceneDescription };
    
    return { updatedCharacter: charToUpdate, finalScene };
}