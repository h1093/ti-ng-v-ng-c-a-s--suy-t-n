import React, { useState } from 'react';
import { InventoryDisplay } from './InventoryDisplay';
import { ProficiencyDisplay } from './ProficiencyDisplay';
import { FaithAndSanctuaryDisplay } from './FaithAndSanctuaryDisplay';
import { SanctuaryDisplay } from './SanctuaryDisplay';
import { Character, SystemAction } from '../types';

interface CharacterDetailsModalProps {
    character: Character;
    onClose: () => void;
    onSystemAction: (action: SystemAction) => void;
    onUseItem: (itemId: string) => void;
}

export const CharacterDetailsModal: React.FC<CharacterDetailsModalProps> = ({ character, onClose, onSystemAction, onUseItem }) => {
    
    const TABS = [
        { key: 'inventory', label: 'Túi Đồ', show: true },
        { key: 'proficiency', label: 'Thông Thạo', show: true },
        { key: 'faith', label: 'Tín Ngưỡng', show: true },
        { key: 'sanctuary', label: 'Thánh Địa', show: !!character.sanctuary },
    ];

    const [activeTab, setActiveTab] = useState('inventory');

    const renderContent = () => {
        switch (activeTab) {
            case 'inventory':
                return <InventoryDisplay inventory={character.inventory} onUseItem={onUseItem} />;
            case 'proficiency':
                return <ProficiencyDisplay character={character} />;
            case 'faith':
                return <FaithAndSanctuaryDisplay character={character} />;
            case 'sanctuary':
                 return character.sanctuary ? <SanctuaryDisplay sanctuary={character.sanctuary} onSystemAction={onSystemAction} /> : null;
            default:
                return null;
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="character-details-title"
        >
            <div className="w-full max-w-3xl h-[80vh] flex flex-col bg-gray-900 border border-gray-700 rounded-lg shadow-2xl shadow-red-900/20" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 id="character-details-title" className="text-2xl font-bold text-red-600">Chi Tiết Nhân Vật</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl" aria-label="Đóng chi tiết nhân vật">
                        &times;
                    </button>
                </header>
                
                <nav className="flex-shrink-0 border-b border-gray-700">
                    <ul className="flex">
                        {TABS.filter(tab => tab.show).map(tab => (
                            <li key={tab.key} className="flex-1">
                                <button
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`w-full py-3 px-2 font-bold transition-colors duration-200 ${
                                        activeTab === tab.key
                                            ? 'text-white bg-red-800/50 border-b-2 border-red-500'
                                            : 'text-gray-400 hover:bg-gray-800'
                                    }`}
                                    role="tab"
                                    aria-selected={activeTab === tab.key}
                                >
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <main className="flex-grow overflow-y-auto" role="tabpanel">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};
