import React from 'react';
import type { Character } from '../types';

const ProficiencyDisplay: React.FC<{character: Character}> = ({ character }) => {
    return (
        <div className="p-4 text-sm">
            <h3 className="font-bold text-gray-300 text-xl mb-4 text-center sr-only">Thông Thạo</h3>
            <div className="space-y-6">
                <div>
                    <h4 className="font-semibold text-red-400 mb-3 text-lg">Vũ Khí</h4>
                    <div className="flex flex-col gap-3">
                        {Object.entries(character.weaponProficiencies).map(([type, prof]) => (
                            <div key={type} className="bg-black/20 p-3 rounded-md border border-gray-700/50">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-gray-200 font-bold">{type}</span>
                                    <span className="text-gray-400 text-xs font-semibold">Cấp {prof.level}</span>
                                </div>
                                <div className="w-full bg-gray-700/50 rounded-full h-2 border border-gray-600/50">
                                    <div className="bg-yellow-500 h-full rounded-full" style={{width: `${(prof.xp / prof.xpToNextLevel) * 100}%`}}></div>
                                </div>
                                <p className="text-right text-xs text-gray-500 mt-1">{prof.xp} / {prof.xpToNextLevel} XP</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-800">
                    <h4 className="font-semibold text-red-400 mb-3 text-lg">Phép Thuật</h4>
                     <div className="flex flex-col gap-3">
                        {Object.entries(character.magicMasteries).map(([school, prof]) => (
                             <div key={school} className="bg-black/20 p-3 rounded-md border border-gray-700/50">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-gray-200 font-bold">{school}</span>
                                    <span className="text-gray-400 text-xs font-semibold">Cấp {prof.level}</span>
                                </div>
                                 <div className="w-full bg-gray-700/50 rounded-full h-2 border border-gray-600/50">
                                    <div className="bg-purple-500 h-full rounded-full" style={{width: `${(prof.xp / prof.xpToNextLevel) * 100}%`}}></div>
                                </div>
                                <p className="text-right text-xs text-gray-500 mt-1">{prof.xp} / {prof.xpToNextLevel} XP</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProficiencyDisplay;
