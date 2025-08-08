

// From craftingData
export interface RecipeMaterial {
  itemId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  materials: RecipeMaterial[];
  result: {
    itemId: string;
    quantity: number;
  };
}

// From itemData
export type ItemEffect = 
    | { type: 'HEAL'; stat: 'hp' | 'san' | 'stamina' | 'mana'; amount: number }
    | { type: 'CURE'; effect: string } // e.g. cure 'poison'
    | { type: 'LEARN_SKILL'; skillId: string }
    | { type: 'LEARN_RECIPE'; recipeId: string };

export interface Item {
    id: string;
    name: string;
    description: string;
    type: 'consumable' | 'book' | 'material' | 'weapon' | 'armor' | 'misc';
    usable: boolean;
    effects?: ItemEffect[];
}

// System Action - A discriminated union for type safety
export interface SanctuaryActionPayload { followerName: string; task: string; }
export interface ChooseLevelUpPathPayload { deity: string; path: string; }

export type SystemAction = 
    | { type: 'USE_ITEM', payload: { itemId: string } }
    | { type: 'CRAFT_ITEM', payload: { recipeId: string } }
    | { type: 'SANCTUARY_ACTION', payload: SanctuaryActionPayload }
    | { type: 'CHOOSE_LEVEL_UP_PATH', payload: ChooseLevelUpPathPayload };



// From loreData
export interface LoreEntry {
  id: string;
  keywords: string[];
  content: string;
}

// From deityData
export interface DeityData {
    name: string;
    powerPathSkillId: string;
}

// From characterData & skillData
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

export type SkillEffect = 
    | { type: 'DAMAGE'; baseAmount: number; damageType: 'physical' | 'arcane' | 'abyss' | 'holy' | 'mental' }
    | { type: 'HEAL'; baseAmount: number; target: 'self' }
    | { type: 'BUFF_STAT'; stat: 'attack' | 'defense'; multiplier: number; duration: number }
    | { type: 'DEBUFF_STAT'; stat: 'attack' | 'defense' | 'speed'; multiplier: number; duration: number; chance?: number }
    | { type: 'APPLY_STATUS'; status: 'blinded' | 'stunned'; chance: number; duration: number };


export interface Skill {
    id: string;
    name: string;
    description: string;
    costType: 'hp' | 'mana' | 'stamina';
    costAmount: number;
    cooldown: number;
    currentCooldown: number;
    school?: string;
    effects: SkillEffect[];
}

export interface Origin {
  name: string;
  description: string;
  baseStats: Partial<Record<keyof CharacterStats, number>>;
  startingEquipment: Record<string, number>; // Key is itemId
  weaponProficiency: string;
  startingRecipes?: string[];
  talents: Talent[];
  startingSkills: string[]; // Now an array of skill IDs
}

export interface Personality {
    name: string;
    description: string;
    effect: string;
}

export interface Ending {
    title: string;
    defaultReason: string;
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
    status: string; // e.g., 'Idle', 'Scavenging', 'Patrolling'
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
  inventory: Record<string, number>; // Key is itemId
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

export type NPCDisposition = 'Thân thiện' | 'Trung lập' | 'Thù địch' | 'Sợ hãi';

export interface NPC {
    id: string;
    name: string;
    description: string;
    disposition: NPCDisposition;
    dialogueHistory?: string[];
}

export interface InventoryChange {
    itemName: string; // Stays as itemName for AI convenience, will be mapped to ID by system if needed
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

// Simplified Scene types for Gemini schema
export interface StatChange {
    stat: string;
    change: number;
}

export interface BodyPartChange {
    part: string;
    status: string;
}

export interface SpecialSkillUpdate {
    name: string;
    proficiency: Proficiency;
}

export interface JournalUpdate {
    category: string;
    title: string;
    content: string;
}

export interface XpAward {
    type: 'weapon' | 'magic' | 'special';
    name: string;
    amount: number;
}


export interface Scene {
    description: string;
    choices: string[];
    hitChances?: { choice: string; chance: number }[];
    enemies: Enemy[];
    npcs?: NPC[];
    statChanges?: StatChange[];
    inventoryChanges?: InventoryChange[];
    bodyPartChanges?: BodyPartChange[];
    gameOver: boolean;
    reason?: string;
    endingKey?: string;
    newlyLearnedSkillIds?: string[];
    newlyLearnedRecipeIds?: string[]; // Changed from newlyLearnedRecipes
    xpAwards?: XpAward[];
    updatedFaith?: { name: string; status: FaithStatus }[];
    updatedSanctuary?: Sanctuary;
    faithNotification?: string;
    sanctuaryNotification?: string;
    markLevelUpEvent?: MarkLevelUpEvent;
    companionActionDescriptions?: string[];
    updatedCompanions?: Companion[];
    tamingResult?: TamingResult;
    reanimationResult?: ReanimationResult;
    journalUpdates?: JournalUpdate[];
}