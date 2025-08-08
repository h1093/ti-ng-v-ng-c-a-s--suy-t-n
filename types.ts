
// From craftingData
export interface RecipeMaterial {
  name: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  materials: RecipeMaterial[];
  result: {
    name: string;
    quantity: number;
  };
}

// From loreData
export interface LoreEntry {
  id: string;
  keywords: string[];
  content: string;
}

// From characterData
export interface Difficulty {
  name: string;
  description: string;
  pointBuy: number;
  permadeath: boolean;
}

export interface Talent {
    name: string;
    description: string;
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    costType: 'hp' | 'mana' | 'stamina';
    costAmount: number;
    cooldown: number;
    currentCooldown: number;
    school?: string;
}

export interface Origin {
  name: string;
  description: string;
  baseStats: Partial<Record<keyof CharacterStats, number>>;
  startingEquipment: Record<string, number>;
  weaponProficiency: string;
  startingRecipes?: string[];
  talents: Talent[];
  startingSkills: Omit<Skill, 'currentCooldown'>[];
}

export interface Personality {
    name: string;
    description: string;
    effect: string;
}

// From characterStateService / App state
export interface CharacterStats {
  hp: number;
  maxHp: number;
  san: number;
  maxSan: number;
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
  attack: number;
  defense: number;
  speed: number;
  charisma: number;
}

export type BodyPart = 'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';
export type BodyPartStatus = 'Khỏe Mạnh' | 'Bị Thương' | 'Nguy Kịch' | 'Bị Cắt Đứt';

export interface Proficiency {
    unlocked: boolean;
    level: number;
    xp: number;
    xpToNextLevel: number;
}

export interface FaithStatus {
    markLevel: number;
    faithPoints: number;
    faithPointsToNextLevel: number;
}

export interface Follower {
    name: string;
    loyalty: number;
    status: string;
}

export interface Sanctuary {
    name: string;
    hope: number;
    population: number;
    improvements: string[];
    followers: Follower[];
}

export interface Companion {
    name: string;
    type: string;
    stats: CharacterStats;
    statusEffects: string[];
    isUndead: boolean;
}

export interface JournalEntry {
    title: string;
    content: string;
}

export interface Journal {
    quests: JournalEntry[];
    lore: JournalEntry[];
    characters: JournalEntry[];
    bestiary: JournalEntry[];
}

export interface Character {
  name: string;
  gender: string;
  backstory: string;
  difficulty: Difficulty;
  origin: Origin;
  talent: Talent;
  personality: Personality;
  stats: CharacterStats;
  bodyParts: Record<BodyPart, BodyPartStatus>;
  hunger: number;
  maxHunger: number;
  thirst: number;
  maxThirst: number;
  reputation: number;
  inventory: Record<string, number>;
  skills: Skill[];
  knownRecipeIds: string[];
  weaponProficiencies: Record<string, Proficiency>;
  magicMasteries: Record<string, Proficiency>;
  specialSkills: {
      BeastTaming: Proficiency;
      Necromancy: Proficiency;
  };
  faith: Record<string, FaithStatus>;
  sanctuary: Sanctuary | null;
  journal: Journal;
  companions: Companion[];
  godMode: boolean;
  customScenario?: string;
}


// From geminiService schemas
export interface Enemy {
    id: string;
    name: string;
    description: string;
    stats: {
        hp: number;
        maxHp: number;
        attack: number;
        defense: number;
        speed: number;
    };
    bodyParts: Record<BodyPart, BodyPartStatus>;
    telegraphedAction: string;
    statusEffects: string[];
}

export interface InventoryChange {
    itemName: string;
    quantity: number;
}

export interface TamingResult {
    success: boolean;
    creatureName: string;
    creatureType: string;
    companion?: Companion;
}

export interface ReanimationResult {
    success: boolean;
    creatureName: string;
    message: string;
    companion?: Companion;
}


export interface MarkLevelUpEvent {
    deity: string;
    newLevel: number;
}

export interface Scene {
    description: string;
    choices: string[];
    hitChances?: { choice: string; chance: number }[];
    enemies: Enemy[];
    statChanges?: Partial<CharacterStats>;
    inventoryChanges?: InventoryChange[];
    bodyPartChanges?: Partial<Record<BodyPart, BodyPartStatus>>;
    gameOver: boolean;
    reason?: string;
    updatedSkills?: Skill[];
    newlyLearnedRecipes?: Recipe[];
    updatedWeaponProficiencies?: { name: string; proficiency: Proficiency }[];
    updatedMagicMasteries?: { name: string; proficiency: Proficiency }[];
    updatedSpecialSkills?: Partial<Character['specialSkills']>;
    specialSkillLearnedNotification?: string;
    xpGains?: string[];
    levelupNotification?: string;
    skillLearnedNotification?: string;
    recipeLearnedNotification?: string;
    updatedFaith?: { name: string; status: FaithStatus }[];
    updatedSanctuary?: Sanctuary;
    faithNotification?: string;
    sanctuaryNotification?: string;
    markLevelUpEvent?: MarkLevelUpEvent;
    companionActionDescriptions?: string[];
    updatedCompanions?: Companion[];
    tamingResult?: TamingResult;
    reanimationResult?: ReanimationResult;
    journalUpdates?: Partial<Journal>;
}