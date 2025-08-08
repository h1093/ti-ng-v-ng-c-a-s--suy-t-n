
import React from 'react';
import { StatDisplay } from './StatDisplay';
import { Companion } from '../types';

interface CompanionDisplayProps {
    companion: Companion;
}

export const CompanionDisplay: React.FC<CompanionDisplayProps> = ({ companion }) => {
    const isUndead = companion.isUndead;
    const borderColor = isUndead ? 'border-purple-700' : 'border-green-700';
    const bgColor = isUndead ? 'bg-purple-900/20' : 'bg-green-900/10';
    const nameColor = isUndead ? 'text-purple-400' : 'text-green-400';
    const effectColor = isUndead ? 'text-purple-400' : 'text-green-400';
    const effectBgColor = isUndead ? 'bg-purple-900/70' : 'bg-green-900/70';
    const effectTextColor = isUndead ? 'text-purple-200' : 'text-green-200';

    return (
        <div className={`p-4 border ${borderColor} ${bgColor} rounded-lg`}>
            <div className="flex justify-between items-center mb-2">
                <h4 className={`text-lg font-bold ${nameColor}`}>{companion.name}</h4>
                <span className="text-sm text-gray-400 italic">{companion.type}</span>
            </div>
            <StatDisplay
                label="HP"
                value={companion.stats.hp}
                maxValue={companion.stats.maxHp}
                color="bg-red-500"
                className="mb-2"
            />
            <StatDisplay
                label="Stamina"
                value={companion.stats.stamina}
                maxValue={companion.stats.maxStamina}
                color="bg-green-500"
            />
            {companion.statusEffects && companion.statusEffects.length > 0 && (
                 <div className="mt-3">
                    <p className={`text-xs ${effectColor} font-bold uppercase tracking-wider`}>Hiệu Ứng</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {companion.statusEffects.map((effect, index) => (
                            <span key={index} className={`text-xs ${effectBgColor} ${effectTextColor} px-2 py-1 rounded-md`}>
                                {effect}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
