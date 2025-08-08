import React from 'react';
import { NPC, NPCDisposition } from '../types';

interface NpcDisplayProps {
    npc: NPC;
}

const dispositionStyles: Record<NPCDisposition, { border: string; bg: string; text: string }> = {
    'Thân thiện': {
        border: 'border-green-700',
        bg: 'bg-green-900/20',
        text: 'text-green-400'
    },
    'Trung lập': {
        border: 'border-blue-700',
        bg: 'bg-blue-900/20',
        text: 'text-blue-400'
    },
    'Thù địch': {
        border: 'border-red-700',
        bg: 'bg-red-900/20',
        text: 'text-red-400'
    },
    'Sợ hãi': {
        border: 'border-yellow-700',
        bg: 'bg-yellow-900/20',
        text: 'text-yellow-400'
    }
};


export const NpcDisplay: React.FC<NpcDisplayProps> = ({ npc }) => {
    const styles = dispositionStyles[npc.disposition] || dispositionStyles['Trung lập'];

    return (
        <div className={`p-4 border ${styles.border} ${styles.bg} rounded-lg flex flex-col h-full`}>
            <div className="flex justify-between items-start mb-2">
                <h4 className={`text-lg font-bold ${styles.text}`}>{npc.name}</h4>
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${styles.bg.replace('20', '70')} ${styles.text}`}>{npc.disposition}</span>
            </div>
            <p className="text-sm text-gray-400 italic flex-grow">
                {npc.description}
            </p>
            <p className="text-xs text-yellow-300/60 italic mt-3 text-center">[ Dùng ô nhập liệu bên dưới để tương tác ]</p>
        </div>
    );
};