import { Character, Scene, BodyPart, BodyPartStatus, CharacterStats, FaithStatus, Sanctuary, Journal, Recipe, Skill, StatChange, BodyPartChange, JournalUpdate, XpAward, SystemAction, Follower, Enemy } from '../types';
import { SKILL_DEFINITIONS } from '../data/skillData';
import { ITEM_DEFINITIONS } from '../data/itemData';
import { RECIPES } from '../data/craftingData';
import { DEITY_DATA } from '../data/deityData';

const HUNGER_PER_TURN = 2;
const THIRST_PER_TURN = 3;

export function advanceTurn(character: Character, inCombat: boolean): { updatedCharacter: Character, turnInfo: string } {
    let updatedCharacter = { ...character };
    let turnInfo = 'Bắt đầu lượt mới.';

    // Reduce skill cooldowns
    if (updatedCharacter.skills && updatedCharacter.skills.length > 0) {
        updatedCharacter.skills = updatedCharacter.skills.map(skill => ({
            ...skill,
            currentCooldown: Math.max(0, skill.currentCooldown - 1)
        }));
        turnInfo += ' Một vài kỹ năng đã được hồi lại.';
    }

    // Apply hunger and thirst outside of combat
    if (!inCombat && !updatedCharacter.godMode) {
        updatedCharacter.hunger = Math.max(0, updatedCharacter.hunger - HUNGER_PER_TURN);
        updatedCharacter.thirst = Math.max(0, updatedCharacter.thirst - THIRST_PER_TURN);
        
        if (updatedCharacter.hunger === 0) {
            updatedCharacter.stats.hp = Math.max(1, updatedCharacter.stats.hp - 1); // Don't let hunger kill, just weaken
            turnInfo += ' Cơn đói đang gặm nhấm bạn từ bên trong.';
        }
        if (updatedCharacter.thirst === 0) {
            updatedCharacter.stats.hp = Math.max(1, updatedCharacter.stats.hp - 2); // Thirst is more dangerous
            turnInfo += ' Cổ họng bạn khô rát vì thiếu nước.';
        }
    }
    
    return { updatedCharacter, turnInfo };
}


export function handlePlayerSkillUsage(
    character: Character, 
    enemies: Enemy[], 
    skillId: string, 
    targetId?: string
): { updatedCharacter: Character, updatedEnemies: Enemy[], notificationLog: string } {
    
    let newCharacter = { ...character };
    let newEnemies = [...enemies];
    let notificationLog = '';

    const skillDef = newCharacter.skills.find(s => s.id === skillId);
    if (!skillDef) {
        return { updatedCharacter: character, updatedEnemies: enemies, notificationLog: "Lỗi: Không tìm thấy kỹ năng." };
    }

    // 1. Check resources and cooldown
    if (skillDef.currentCooldown > 0 && !newCharacter.godMode) {
        return { updatedCharacter: character, updatedEnemies: enemies, notificationLog: `Kỹ năng ${skillDef.name} đang trong thời gian hồi.` };
    }
    if (newCharacter.stats[skillDef.costType] < skillDef.costAmount && !newCharacter.godMode) {
        return { updatedCharacter: character, updatedEnemies: enemies, notificationLog: `Không đủ ${skillDef.costType} để dùng ${skillDef.name}.` };
    }

    // 2. Pay costs and set cooldown
    if (!newCharacter.godMode) {
        newCharacter.stats[skillDef.costType] -= skillDef.costAmount;
        const skillIndex = newCharacter.skills.findIndex(s => s.id === skillId);
        if (skillIndex > -1) {
            newCharacter.skills[skillIndex].currentCooldown = skillDef.cooldown;
        }
    }
    
    notificationLog = `[ Người chơi đã sử dụng ${skillDef.name}. ]`;

    // 3. Apply effects
    skillDef.effects.forEach(effect => {
        switch(effect.type) {
            case 'DAMAGE':
                const targetEnemy = newEnemies.find(e => e.id === targetId) || newEnemies[0];
                if (targetEnemy) {
                    const damage = Math.max(1, effect.baseAmount + newCharacter.stats.attack - targetEnemy.stats.defense);
                    targetEnemy.stats.hp -= damage;
                    notificationLog += `\n[ ${skillDef.name} gây ${damage} sát thương ${effect.damageType} lên ${targetEnemy.name}. ]`;
                }
                break;
            
            case 'HEAL':
                if (effect.target === 'self') {
                    // Special case for blood offering
                    if (skillDef.id === 'cultist_blood_offering') {
                         newCharacter.stats.mana += effect.baseAmount;
                         notificationLog += `\n[ Bạn hiến tế máu, nhận lại ${effect.baseAmount} Mana. ]`;
                    } else {
                        newCharacter.stats.hp += effect.baseAmount;
                        notificationLog += `\n[ Bạn được hồi ${effect.baseAmount} Máu. ]`;
                    }
                }
                break;
            // Buff/debuff logic would be more complex, involving tracking temporary effects.
            // This is a simplified version for now.
        }
    });

    // Clean up dead enemies
    newEnemies = newEnemies.filter(e => e.stats.hp > 0);

    const { clampedStats } = clampStats(newCharacter.stats, newCharacter.hunger, newCharacter.thirst, newCharacter.maxHunger, newCharacter.maxThirst);
    newCharacter.stats = clampedStats;

    return { updatedCharacter: newCharacter, updatedEnemies: newEnemies, notificationLog };
}


// --- SYSTEM-DELEGATED ACTION HANDLER ---

export function handleSystemAction(character: Character, action: SystemAction): { updatedCharacter: Character, notification: string } {
    let newCharacter = { ...character };
    let notification = '';

    switch(action.type) {
        case 'USE_ITEM': {
            const { itemId } = action.payload;
            const itemDef = ITEM_DEFINITIONS[itemId];
            if (!itemDef || !itemDef.usable || (newCharacter.inventory[itemId] || 0) < 1) {
                notification = "Không thể sử dụng vật phẩm này.";
                break;
            }

            newCharacter.inventory[itemId] = (newCharacter.inventory[itemId] || 1) - 1;
            if (newCharacter.inventory[itemId] <= 0) delete newCharacter.inventory[itemId];
            
            notification = `Bạn đã sử dụng ${itemDef.name}.`;

            itemDef.effects?.forEach(effect => {
                switch(effect.type) {
                    case 'HEAL':
                        newCharacter.stats[effect.stat] += effect.amount;
                        notification += `\n[ ${effect.stat.toUpperCase()} +${effect.amount} ]`;
                        break;
                    case 'LEARN_SKILL':
                        const { updatedCharacter, notifications } = learnNewSkills(newCharacter, [effect.skillId]);
                        newCharacter = updatedCharacter;
                        notification += `\n${notifications.join('\n')}`;
                        break;
                    case 'LEARN_RECIPE':
                         const { updatedCharacter: charAfterRecipe, notifications: recipeNotifs } = learnNewRecipes(newCharacter, [effect.recipeId]);
                        newCharacter = charAfterRecipe;
                        notification += `\n${recipeNotifs.join('\n')}`;
                        break;
                }
            });
            break;
        }

        case 'CRAFT_ITEM': {
            const { recipeId } = action.payload;
            const recipe = RECIPES[recipeId];
            if (!recipe) {
                notification = "Công thức không tồn tại.";
                break;
            }

            const canCraft = recipe.materials.every(mat => (newCharacter.inventory[mat.itemId] || 0) >= mat.quantity);
            if (!canCraft && !newCharacter.godMode) {
                notification = "Không đủ vật liệu.";
                break;
            }

            if (!newCharacter.godMode) {
                recipe.materials.forEach(mat => {
                    newCharacter.inventory[mat.itemId] -= mat.quantity;
                    if (newCharacter.inventory[mat.itemId] <= 0) delete newCharacter.inventory[mat.itemId];
                });
            }

            newCharacter.inventory[recipe.result.itemId] = (newCharacter.inventory[recipe.result.itemId] || 0) + recipe.result.quantity;
            const resultItem = ITEM_DEFINITIONS[recipe.result.itemId];
            notification = `[ Bạn đã chế tạo thành công ${resultItem?.name || 'vật phẩm'} x${recipe.result.quantity}! ]`;
            break;
        }

        case 'SANCTUARY_ACTION': {
            const { followerName, task } = action.payload;
            if (!newCharacter.sanctuary) break;

            const followerIndex = newCharacter.sanctuary.followers.findIndex(f => f.name === followerName);
            if (followerIndex > -1) {
                newCharacter.sanctuary.followers[followerIndex].status = task;
                notification = `[ ${followerName} đã bắt đầu nhiệm vụ: ${task === 'Scavenging' ? 'Tìm kiếm tài nguyên' : 'Tuần tra'}. ]`;
            }
            break;
        }

        case 'CHOOSE_LEVEL_UP_PATH': {
            const { deity, path } = action.payload;
            notification = `[ Bạn đã chọn Con Đường ${path} của ${deity}. ]`;

            switch(path) {
                case 'Sức Mạnh':
                    newCharacter.stats.maxHp += 5;
                    newCharacter.stats.hp += 5;
                    notification += `\n[ Máu tối đa +5! ]`;
                    break;
                case 'Quyền Năng':
                    const deityData = DEITY_DATA[deity];
                    if (deityData) {
                        const { updatedCharacter, notifications: skillNotifs } = learnNewSkills(newCharacter, [deityData.powerPathSkillId]);
                        newCharacter = updatedCharacter;
                        notification += `\n${skillNotifs.join('\n')}`;
                    }
                    break;
                case 'Ảnh Hưởng':
                    if (newCharacter.sanctuary) {
                        const newFollower: Follower = { name: `Tín đồ mới #${newCharacter.sanctuary.followers.length + 1}`, loyalty: 50, status: 'Idle' };
                        newCharacter.sanctuary.followers.push(newFollower);
                        newCharacter.sanctuary.population += 1;
                        notification += `\n[ Một tín đồ mới đã gia nhập Thánh Địa của bạn! ]`;
                    } else {
                        notification += `\n[ Nhưng bạn chưa có Thánh Địa để họ đi theo. ]`;
                    }
                    break;
            }
            break;
        }
    }

    const { clampedStats, clampedHunger, clampedThirst } = clampStats(newCharacter.stats, newCharacter.hunger, newCharacter.thirst, newCharacter.maxHunger, newCharacter.maxThirst);
    newCharacter.stats = clampedStats;
    newCharacter.hunger = clampedHunger;
    newCharacter.thirst = clampedThirst;

    return { updatedCharacter: newCharacter, notification };
}


// --- AI SCENE PROCESSING LOGIC ---

function applyStatChanges(currentStats: CharacterStats, statChanges?: StatChange[]): CharacterStats {
    if (!statChanges) return currentStats;
    const newStats = { ...currentStats };
    const validStats = Object.keys(newStats);

    for (const change of statChanges) {
        if (validStats.includes(change.stat)) {
            const statKey = change.stat as keyof CharacterStats;
            newStats[statKey] = Math.max(0, (newStats[statKey] || 0) + change.change);
        }
    }
    return newStats;
}

function applyInventoryChanges(currentInventory: Record<string, number>, inventoryChanges?: { itemName: string, quantity: number }[]): Record<string, number> {
    if (!inventoryChanges) return currentInventory;
    const newInventory = { ...currentInventory };

    const itemMap = Object.values(ITEM_DEFINITIONS).reduce((acc, item) => {
        acc[item.name] = item.id;
        return acc;
    }, {} as Record<string, string>);

    for (const change of inventoryChanges) {
        const itemId = itemMap[change.itemName] || change.itemName; // Fallback to itemName if not found
        newInventory[itemId] = (newInventory[itemId] || 0) + change.quantity;
        if (newInventory[itemId] <= 0) {
            delete newInventory[itemId];
        }
    }
    return newInventory;
}

function applyBodyPartChanges(currentBodyParts: Record<BodyPart, BodyPartStatus>, bodyPartChanges?: BodyPartChange[]): Record<BodyPart, BodyPartStatus> {
    if (!bodyPartChanges) return currentBodyParts;
    const newBodyParts = { ...currentBodyParts };
    const validParts = Object.keys(newBodyParts);

    for (const change of bodyPartChanges) {
        if (validParts.includes(change.part)) {
             const partKey = change.part as BodyPart;
             newBodyParts[partKey] = change.status as BodyPartStatus;
        }
    }
    return newBodyParts;
}

function applyXpAndLevelUp(character: Character, xpAwards?: XpAward[]): { updatedCharacter: Character, notifications: string[] } {
    if (!xpAwards || xpAwards.length === 0) {
        return { updatedCharacter: character, notifications: [] };
    }

    const newCharacter = { ...character };
    const notifications: string[] = [];
    const proficiencies = {
        weapon: newCharacter.weaponProficiencies,
        magic: newCharacter.magicMasteries,
        special: newCharacter.specialSkills,
    };

    for (const award of xpAwards) {
        const proficiencyGroup = proficiencies[award.type as keyof typeof proficiencies];
        if (proficiencyGroup && proficiencyGroup[award.name]) {
            const prof = proficiencyGroup[award.name];
            prof.xp += award.amount;
            notifications.push(`[ Bạn nhận được ${award.amount} XP cho ${award.name}. ]`);

            while (prof.xp >= prof.xpToNextLevel) {
                prof.level += 1;
                prof.xp -= prof.xpToNextLevel;
                prof.xpToNextLevel = Math.floor(prof.xpToNextLevel * 1.5);
                notifications.push(`[ ${award.name} đã lên Cấp ${prof.level}! ]`);
            }
        }
    }

    return { updatedCharacter: newCharacter, notifications };
}


function learnNewSkills(character: Character, newlyLearnedSkillIds?: string[]): { updatedCharacter: Character, notifications: string[] } {
    if (!newlyLearnedSkillIds || newlyLearnedSkillIds.length === 0) {
        return { updatedCharacter: character, notifications: [] };
    }

    const newCharacter = { ...character };
    const notifications: string[] = [];
    
    for (const skillId of newlyLearnedSkillIds) {
        const skillExists = newCharacter.skills.some(s => s.id === skillId);
        const skillDef = SKILL_DEFINITIONS[skillId];

        if (skillDef && !skillExists) {
            const newSkill: Skill = { ...skillDef, currentCooldown: 0 };
            newCharacter.skills.push(newSkill);
            notifications.push(`[ Bạn đã học được kỹ năng mới: ${skillDef.name} ]`);
        }
    }
    
    return { updatedCharacter: newCharacter, notifications };
}

function learnNewRecipes(character: Character, newlyLearnedRecipeIds?: string[]): { updatedCharacter: Character, notifications: string[] } {
    if (!newlyLearnedRecipeIds) {
        return { updatedCharacter: character, notifications: [] };
    }
    const newCharacter = { ...character };
    const notifications: string[] = [];

    for (const recipeId of newlyLearnedRecipeIds) {
        if (!newCharacter.knownRecipeIds.includes(recipeId)) {
            newCharacter.knownRecipeIds.push(recipeId);
            const recipe = RECIPES[recipeId];
            if (recipe) {
                notifications.push(`[ Bạn đã học công thức mới: ${recipe.name} ]`);
            }
        }
    }
    return { updatedCharacter: newCharacter, notifications };
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

function applyJournalUpdates(currentJournal: Journal, journalUpdates?: JournalUpdate[]): { updatedJournal: Journal, wasUpdated: boolean } {
    if (!journalUpdates || journalUpdates.length === 0) {
        return { updatedJournal: currentJournal, wasUpdated: false };
    }

    const newJournal = { ...currentJournal };
    const validCategories = Object.keys(newJournal);
    let wasUpdated = false;
    
    for (const update of journalUpdates) {
        if (validCategories.includes(update.category)) {
            const categoryKey = update.category as keyof Journal;
            const existingEntries = newJournal[categoryKey];
            const entryExists = existingEntries.some(e => e.title === update.title);
            
            if (!entryExists) {
                newJournal[categoryKey] = [...existingEntries, { title: update.title, content: update.content }];
                wasUpdated = true;
            }
        }
    }
    return { updatedJournal: newJournal, wasUpdated };
}

function assembleNotifications(
    scene: Scene, 
    recipeNotifications: string[], 
    journalWasUpdated: boolean,
    xpNotifications: string[],
    skillNotifications: string[]
): string {
    const parts: string[] = [];

    if (scene.companionActionDescriptions && scene.companionActionDescriptions.length > 0) {
        scene.companionActionDescriptions.forEach(desc => parts.push(`[ ${desc} ]`));
    }
    
    parts.push(...xpNotifications);
    parts.push(...skillNotifications);
    parts.push(...recipeNotifications);

    if (journalWasUpdated) parts.push('[ Nhật ký đã được cập nhật. ]');
    
    if (scene.sanctuaryNotification) parts.push(`[ ${scene.sanctuaryNotification} ]`);
    if (scene.faithNotification) parts.push(`[ ${scene.faithNotification} ]`);
    
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
    
    const { updatedCharacter: charAfterXp, notifications: xpNotifications } = applyXpAndLevelUp(charToUpdate, scene.xpAwards);
    charToUpdate = charAfterXp;

    const { updatedCharacter: charAfterSkills, notifications: skillNotifications } = learnNewSkills(charToUpdate, scene.newlyLearnedSkillIds);
    charToUpdate = charAfterSkills;
    
    const { updatedCharacter: charAfterRecipes, notifications: recipeNotifications } = learnNewRecipes(charToUpdate, scene.newlyLearnedRecipeIds);
    charToUpdate = charAfterRecipes;

    charToUpdate.faith = applyFaithUpdates(charToUpdate.faith, scene.updatedFaith);
    charToUpdate.sanctuary = applySanctuaryUpdate(charToUpdate.sanctuary, scene.updatedSanctuary);

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

    let notificationText = assembleNotifications(scene, recipeNotifications, journalWasUpdated, xpNotifications, skillNotifications);
    
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
    
    const sceneDescription = notificationText.trim() ? `${notificationText.trim()}\n\n${scene.description}` : scene.description;

    const { clampedStats, clampedHunger, clampedThirst } = clampStats(charToUpdate.stats, charToUpdate.hunger, charToUpdate.thirst, charToUpdate.maxHunger, charToUpdate.maxThirst);
    charToUpdate.stats = clampedStats;
    charToUpdate.hunger = clampedHunger;
    charToUpdate.thirst = clampedThirst;

    charToUpdate = applyGodMode(charToUpdate);

    const finalScene: Scene = { ...scene, description: sceneDescription };
    
    return { updatedCharacter: charToUpdate, finalScene };
}