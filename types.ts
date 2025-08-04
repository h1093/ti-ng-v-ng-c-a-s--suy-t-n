export type BodyPart = 'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';
export type BodyPartStatus = 'Khỏe Mạnh' | 'Bị Thương' | 'Nguy Kịch' | 'Bị Cắt Đứt';

export type MagicSchool = 'Huyền Bí' | 'Huyết Thuật' | 'Vực Thẳm' | 'Thánh Thánh';

export type DeityName = 'Sylvian' | 'Gro-goroth' | 'Alll-mer' | 'Khaos, Đấng Hỗn Mang' | 'Aethel, Người Dệt Hư Không' | 'Lithos, Ý Chí Của Đá';

export interface FaithStatus {
  markLevel: number;
  faithPoints: number;
  faithPointsToNextLevel: number;
}

export interface Follower {
    name: string;
    loyalty: number; // 0-100
    status: string; // e.g., "Idle", "Injured", "On Mission"
}

export interface Sanctuary {
    name: string;
    hope: number;
    population: number;
    improvements: string[];
    followers: Follower[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  costType: 'mana' | 'stamina' | 'hp' | 'san';
  costAmount: number;
  cooldown: number; // total cooldown in turns
  currentCooldown: number; // turns remaining
  school?: MagicSchool; // for magic spells
}

export interface Proficiency {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface BaseStats {
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

export interface PlayerStats extends BaseStats {}

export interface Enemy {
  id: string; // Unique identifier for each enemy in a scene
  name:string;
  description: string;
  stats: BaseStats;
  bodyParts: Record<BodyPart, BodyPartStatus>;
  telegraphedAction: string; // Action the enemy will perform next turn
  statusEffects?: string[]; // e.g., ["Slowed", "Disarmed"]
}

export interface HitChance {
    choice: string;
    chance: number;
}

export interface WeaponProficiencyUpdate {
    name: string;
    proficiency: Proficiency;
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

export interface Recipe {
    id: string;
    name: string;
    description: string;
    materials: { name: string; quantity: number }[];
    result: { name: string; quantity: number };
}

export interface Companion {
    name: string;
    type: string;
    stats: BaseStats;
    statusEffects?: string[];
    isUndead?: boolean;
}

export interface Scene {
  description: string;
  choices: string[];
  hitChances?: HitChance[];
  enemies?: Enemy[];
  statChanges?: Partial<Record<keyof PlayerStats, number>>;
  bodyPartChanges?: Partial<Record<BodyPart, BodyPartStatus>>;
  inventoryChanges?: { itemName: string; quantity: number }[];
  gameOver?: boolean;
  reason?: string;
  updatedSkills?: Skill[];
  updatedWeaponProficiencies?: WeaponProficiencyUpdate[];
  updatedMagicMasteries?: Record<MagicSchool, Proficiency>;
  xpGains?: string[]; // e.g. ["+10 XP Kiếm và Khiên"]
  levelupNotification?: string;
  skillLearnedNotification?: string;
  recipeLearnedNotification?: string;
  updatedFaith?: Record<DeityName, FaithStatus>;
  updatedSanctuary?: Sanctuary;
  faithNotification?: string;
  sanctuaryNotification?: string;
  journalUpdates?: Partial<Journal>;
  newlyLearnedRecipes?: Recipe[];
  markLevelUpEvent?: { deity: DeityName; newLevel: number; };
  companionActionDescriptions?: string[];
  updatedCompanions?: Companion[];
  reanimationResult?: {
      success: boolean;
      creatureName: string;
      companion?: Companion;
      message?: string;
  };
  tamingResult?: { 
      success: boolean; 
      creatureName: string; 
      creatureType: string; 
      companion?: Companion 
  };
}

export type GameState = 'START_SCREEN' | 'CHARACTER_CREATION' | 'PLAYING' | 'GAME_OVER';

export interface Talent {
  name: string;
  description: string;
}

export interface Origin {
  name: string;
  description: string;
  baseStats: Partial<BaseStats>;
  startingEquipment: Record<string, number>;
  weaponProficiency: string;
  talents: Talent[];
  startingSkills: Omit<Skill, 'currentCooldown'>[];
  startingRecipes?: string[];
}

export interface Personality {
  name: string;
  description: string;
  effect: string;
}

export interface Difficulty {
  name: string;
  description: string;
  pointBuy: number;
  permadeath: boolean;
}

export interface Character {
  name: string;
  gender: string;
  backstory: string;
  difficulty: Difficulty;
  origin: Origin;
  talent: Talent;
  personality: Personality;
  stats: PlayerStats;
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
  magicMasteries: Record<MagicSchool, Proficiency>;
  faith: Record<DeityName, FaithStatus>;
  sanctuary: Sanctuary | null;
  journal: Journal;
  companions: Companion[];
  godMode?: boolean;
  customScenario?: string;
}