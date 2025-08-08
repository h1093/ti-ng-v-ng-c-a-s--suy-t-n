
import React, { useState } from 'react';
import { Journal as JournalType } from '../types';

interface JournalProps {
    journal: JournalType;
    onClose: () => void;
}

const TABS: {key: keyof JournalType, label: string}[] = [
    { key: 'quests', label: 'Nhiệm Vụ' },
    { key: 'lore', label: 'Tri Thức' },
    { key: 'characters', label: 'Nhân Vật' },
    { key: 'bestiary', label: 'Quái Vật' },
];

export const Journal: React.FC<JournalProps> = ({ journal, onClose }) => {
    const [activeTab, setActiveTab] = useState<keyof JournalType>('quests');

    const renderContent = () => {
        const entries = journal[activeTab];
        if (!entries || entries.length === 0) {
            return <p className="text-gray-500 italic p-4 text-center">Chưa có ghi chép nào.</p>;
        }
        return (
            <div className="p-4 space-y-4">
                {entries.map((entry, index) => (
                    <div key={`${activeTab}-${index}`} className="bg-black/20 p-3 rounded-md border border-gray-700/50">
                        <h4 className="font-bold text-red-400 text-lg">{entry.title}</h4>
                        <p className="text-gray-300 whitespace-pre-wrap">{entry.content}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="journal-title"
        >
            <div className="w-full max-w-3xl h-[80vh] flex flex-col bg-gray-900 border border-gray-700 rounded-lg shadow-2xl shadow-red-900/20" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 id="journal-title" className="text-2xl font-bold text-red-600">Nhật Ký</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl" aria-label="Đóng nhật ký">
                        &times;
                    </button>
                </header>
                
                <nav className="flex-shrink-0 border-b border-gray-700">
                    <ul className="flex">
                        {TABS.map(tab => (
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
