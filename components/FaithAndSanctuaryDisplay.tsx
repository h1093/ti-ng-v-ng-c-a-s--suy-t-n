
import React from 'react';
import { Character } from '../types';

const deityColors: Record<string, { text: string; bg: string; border: string }> = {
    'Sylvian': { text: 'text-green-300', bg: 'bg-green-700/50', border: 'border-green-500' },
    'Gro-goroth': { text: 'text-red-300', bg: 'bg-red-700/50', border: 'border-red-500' },
    'Alll-mer': { text: 'text-yellow-300', bg: 'bg-yellow-700/50', border: 'border-yellow-500' },
    'Khaos, Đấng Hỗn Mang': { text: 'text-purple-300', bg: 'bg-purple-700/50', border: 'border-purple-500' },
    'Aethel, Người Dệt Hư Không': { text: 'text-gray-300', bg: 'bg-gray-700/50', border: 'border-gray-500' },
    'Lithos, Ý Chí Của Đá': { text: 'text-orange-400', bg: 'bg-orange-700/50', border: 'border-orange-500' }
};

interface FaithAndSanctuaryDisplayProps {
    character: Character;
}

export const FaithAndSanctuaryDisplay: React.FC<FaithAndSanctuaryDisplayProps> = ({ character }) => {
    const { faith, sanctuary } = character;
    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="font-bold text-gray-300 text-xl mb-4 text-center sr-only">Tín Ngưỡng</h3>
                <div className="space-y-4">
                    {Object.keys(faith).map(deityName => {
                        const status = faith[deityName];
                        if (!status) return null;
                        const colors = deityColors[deityName] || { text: 'text-gray-300', bg: 'bg-gray-700/50', border: 'border-gray-500' };
                        const percentage = status.faithPointsToNextLevel > 0 ? Math.max(0, status.faithPoints / status.faithPointsToNextLevel * 100) : 0;
                        
                        return (
                            <div key={deityName} className="bg-black/20 p-3 rounded-md border border-gray-700/50">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`${colors.text} font-bold text-lg`}>{deityName}</span>
                                    <span className="text-gray-400 font-semibold">Ấn Ký {status.markLevel}</span>
                                </div>
                                <div className={`w-full bg-gray-700/50 rounded-full h-2 border border-gray-600/50`}>
                                    <div className={`h-full rounded-full transition-all duration-300 ${colors.bg.replace('/50', '')}`} style={{ width: `${percentage}%` }}></div>
                                </div>
                                <p className="text-right text-xs text-gray-500 mt-1">{status.faithPoints} / {status.faithPointsToNextLevel} Tín ngưỡng</p>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {sanctuary && (
                 <div className="pt-6 border-t border-gray-700">
                    <h3 className="font-bold text-gray-300 text-xl mb-4 text-center">Thánh Địa: {sanctuary.name}</h3>
                     <div className="grid grid-cols-2 gap-4 text-center bg-black/20 p-3 rounded-md border border-gray-700/50">
                         <div>
                             <span className="text-gray-400 uppercase text-xs">Hy Vọng</span>
                             <p className="font-bold text-2xl text-white">{sanctuary.hope}</p>
                         </div>
                         <div>
                             <span className="text-gray-400 uppercase text-xs">Dân Số</span>
                             <p className="font-bold text-2xl text-white">{sanctuary.population}</p>
                         </div>
                     </div>
                     {sanctuary.followers.length > 0 && (
                         <div className="mt-4">
                            <h4 className="font-semibold text-gray-400 text-center mb-2">Tín Đồ</h4>
                             <ul className="mt-1 flex flex-col gap-2 text-left">
                                 {sanctuary.followers.map(f => (
                                     <li key={f.name} className="bg-black/20 px-3 py-2 rounded-md border border-gray-700/50 text-gray-300">
                                         {f.name} <span className="text-gray-500 text-sm">- {f.status} (Lòng Trung Thành: {f.loyalty})</span>
                                     </li>
                                 ))}
                             </ul>
                         </div>
                     )}
                 </div>
            )}
        </div>
    );
};
