import { Skill } from '../types';

export const SKILL_DEFINITIONS: Record<string, Omit<Skill, 'currentCooldown'>> = {
    // Survivor
    'survivor_pocket_sand': { 
        id: "survivor_pocket_sand", 
        name: "Ném Cát", 
        description: "Ném cát vào mắt kẻ thù, có cơ hội làm giảm độ chính xác của chúng trong lượt tiếp theo.", 
        costType: "stamina", 
        costAmount: 10, 
        cooldown: 2,
        effects: [
            { type: 'APPLY_STATUS', status: 'blinded', chance: 0.7, duration: 1 }
        ]
    },

    // Scholar
    'scholar_arcane_bolt': {
        id: "scholar_arcane_bolt", 
        name: "Tia Năng Lượng", 
        description: "Bắn một tia năng lượng huyền bí gây sát thương vừa phải.", 
        costType: "mana", 
        costAmount: 15, 
        cooldown: 0, 
        school: "Huyền Bí",
        effects: [
            { type: 'DAMAGE', baseAmount: 15, damageType: 'arcane' }
        ]
    },
    'scholar_mental_assault': {
        id: "scholar_mental_assault",
        name: "Tấn Công Tâm Trí",
        description: "Tấn công thẳng vào tâm trí kẻ địch, gây sát thương Tinh thần lớn và có thể gây choáng.",
        costType: "mana",
        costAmount: 30,
        cooldown: 4,
        school: "Huyền Bí",
        effects: [
            { type: 'DAMAGE', baseAmount: 25, damageType: 'mental' },
            { type: 'APPLY_STATUS', status: 'stunned', chance: 0.3, duration: 1 }
        ]
    },

    // Knight
    'knight_defensive_stance': { 
        id: "knight_defensive_stance", 
        name: "Thế Thủ", 
        description: "Tăng mạnh Phòng thủ trong 1 lượt, nhưng giảm Tấn công.", 
        costType: "stamina", 
        costAmount: 20, 
        cooldown: 3,
        effects: [
            { type: 'BUFF_STAT', stat: 'defense', multiplier: 2, duration: 1 },
            { type: 'DEBUFF_STAT', stat: 'attack', multiplier: 0.5, duration: 1 }
        ]
    },

    // Barbarian
    'barbarian_savage_strike': { 
        id: "barbarian_savage_strike", 
        name: "Chém Man Rợ", 
        description: "Một đòn tấn công mạnh mẽ gây sát thương lớn nhưng làm giảm Phòng thủ của bạn trong lượt này.", 
        costType: "stamina", 
        costAmount: 25, 
        cooldown: 2,
        effects: [
            { type: 'DAMAGE', baseAmount: 30, damageType: 'physical' },
            { type: 'DEBUFF_STAT', stat: 'defense', multiplier: 0.5, duration: 1 }
        ]
    },
    
    // Dark Ritualist
    'dark_ritualist_drain_life': { 
        id: "dark_ritualist_drain_life", 
        name: "Hút Sinh Lực", 
        description: "Hút một lượng nhỏ máu từ mục tiêu để hồi phục cho bản thân. Gây sát thương Vực Thẳm.", 
        costType: "mana", 
        costAmount: 18, 
        cooldown: 2, 
        school: "Vực Thẳm",
        effects: [
            { type: 'DAMAGE', baseAmount: 12, damageType: 'abyss' },
            { type: 'HEAL', baseAmount: 12, target: 'self' }
        ]
    },

    // Archer
    'archer_crippling_shot': { 
        id: "archer_crippling_shot", 
        name: "Bắn Tê Liệt", 
        description: "Bắn vào chân kẻ thù, có cơ hội làm giảm Tốc độ của chúng.", 
        costType: "stamina", 
        costAmount: 20, 
        cooldown: 3,
        effects: [
            { type: 'DAMAGE', baseAmount: 10, damageType: 'physical' },
            { type: 'DEBUFF_STAT', stat: 'speed', multiplier: 0.5, duration: 2, chance: 0.8 }
        ]
    },
    
    // Cultist
    'cultist_blood_offering': { 
        id: "cultist_blood_offering", 
        name: "Hiến Tế Máu", 
        description: "Hy sinh Máu để đổi lấy một lượng lớn Mana.", 
        costType: "hp", 
        costAmount: 20, 
        cooldown: 1, 
        school: "Huyết Thuật",
        effects: [
             { type: 'HEAL', baseAmount: 40, target: 'self' } // Hacky way to add mana, to be processed specially
        ]
    },
    
    // --- Special Skills ---
    'special_try_taming': {
        id: "special_try_taming",
        name: "Thử Thuần Hóa",
        description: "Cố gắng thuần hóa một sinh vật không có tri giác. Chỉ có thể sử dụng ngoài chiến đấu.",
        costType: "stamina",
        costAmount: 30,
        cooldown: 0,
        effects: [] // Logic handled by AI in non-combat
    },
    'special_try_reanimation': {
        id: "special_try_reanimation",
        name: "Thử Gọi Hồn",
        description: "Thực hiện một nghi lễ hắc ám để hồi sinh một xác chết thành đệ tử bất tử. Chỉ có thể sử dụng ngoài chiến đấu.",
        costType: "mana",
        costAmount: 40,
        cooldown: 0,
        school: "Vực Thẳm",
        effects: [] // Logic handled by AI in non-combat
    },
};