import React from 'react';
import { Sanctuary, SystemAction } from '../types';

interface SanctuaryDisplayProps {
    sanctuary: Sanctuary;
    onSystemAction: (action: SystemAction) => void;
}

export const SanctuaryDisplay: React.FC<SanctuaryDisplayProps> = ({ sanctuary, onSystemAction }) => {

    const handleAction = (followerName: string, task: string) => {
        onSystemAction({
            type: 'SANCTUARY_ACTION',
            payload: {
                followerName,
                task
            }
        });
    };

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="font-bold text-cyan-400 text-2xl mb-4 text-center">Thánh Địa: {sanctuary.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center bg-black/20 p-4 rounded-md border border-gray-700/50">
                    <div>
                        <span className="text-gray-400 uppercase text-xs tracking-wider">Hy Vọng</span>
                        <p className="font-bold text-3xl text-white">{sanctuary.hope}</p>
                    </div>
                    <div>
                        <span className="text-gray-400 uppercase text-xs tracking-wider">Dân Số</span>
                        <p className="font-bold text-3xl text-white">{sanctuary.population}</p>
                    </div>
                </div>
            </div>
            
            {sanctuary.followers.length > 0 && (
                 <div className="pt-6 border-t border-gray-800">
                    <h4 className="font-semibold text-cyan-400 text-xl text-center mb-4">Quản Lý Tín Đồ</h4>
                     <ul className="mt-1 flex flex-col gap-4 text-left">
                         {sanctuary.followers.map(f => (
                             <li key={f.name} className="bg-black/20 p-4 rounded-md border border-gray-700/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-lg text-gray-200">{f.name}</p>
                                        <p className="text-gray-400 text-sm">Lòng Trung Thành: <span className="font-semibold text-yellow-400">{f.loyalty}</span></p>
                                        <p className="text-gray-400 text-sm">Trạng Thái: <span className="italic">{f.status}</span></p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <button onClick={() => handleAction(f.name, 'Scavenging')} disabled={f.status !== 'Idle'} className="text-xs bg-green-800/70 border border-green-700 text-green-300 font-semibold py-1 px-3 rounded-sm transition-colors hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed">
                                            Tìm Tài Nguyên
                                        </button>
                                        <button onClick={() => handleAction(f.name, 'Patrolling')} disabled={f.status !== 'Idle'} className="text-xs bg-blue-800/70 border border-blue-700 text-blue-300 font-semibold py-1 px-3 rounded-sm transition-colors hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed">
                                            Tuần Tra
                                        </button>
                                    </div>
                                </div>
                             </li>
                         ))}
                     </ul>
                 </div>
            )}
        </div>
    );
};
