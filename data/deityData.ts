import { DeityData } from '../types';

// This file centralizes the game rules for deity mark level-ups.
// The system can now reliably grant rewards without needing the AI to remember them.

export const DEITY_DATA: Record<string, DeityData> = {
    'Khaos, Đấng Hỗn Mang': {
        name: 'Khaos, Đấng Hỗn Mang',
        // Example skill ID, assuming it exists in skillData.ts
        powerPathSkillId: 'chaos_unpredictable_strike' 
    },
    'Aethel, Người Dệt Hư Không': {
        name: 'Aethel, Người Dệt Hư Không',
        powerPathSkillId: 'aethel_veil_of_shadows'
    },
    'Lithos, Ý Chí Của Đá': {
        name: 'Lithos, Ý Chí Của Đá',
        powerPathSkillId: 'lithos_earthen_armor'
    },
    'Sylvian': {
        name: 'Sylvian',
        powerPathSkillId: 'sylvian_healing_embrace'
    },
    'Gro-goroth': {
        name: 'Gro-goroth',
        powerPathSkillId: 'gro_goroth_blood_frenzy'
    },
    'Alll-mer': {
        name: 'Alll-mer',
        powerPathSkillId: 'alll_mer_holy_smite'
    }
};
