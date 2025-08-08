
import React from 'react';
import { ITEM_DEFINITIONS } from '../data/itemData';

interface InventoryDisplayProps {
    inventory: Record<string, number>;
    onUseItem: (itemId: string) => void;
}

export const InventoryDisplay: React.FC<InventoryDisplayProps> = ({ inventory, onUseItem }) => {
    const items = Object.entries(inventory);
    
    return (
        <div className="p-4">
            <h3 className="font-bold text-gray-300 text-xl mb-4 text-center sr-only">Túi Đồ</h3>
            {items.length > 0 ? (
                <ul className="text-sm text-gray-300 space-y-2">
                    {items.map(([itemId, quantity]) => {
                        const itemDef = ITEM_DEFINITIONS[itemId];
                        if (!itemDef) return null;

                        return (
                            <li key={itemId} className="flex flex-col sm:flex-row justify-between sm:items-center bg-black/20 p-3 rounded-md border border-gray-700/50 gap-2">
                                <div className="flex-grow">
                                    <p className="font-semibold">{itemDef.name} <span className="font-bold text-gray-400">x{quantity}</span></p>
                                    <p className="text-xs text-gray-500 italic">{itemDef.description}</p>
                                </div>
                                {itemDef.usable && (
                                     <button 
                                        onClick={() => onUseItem(itemId)}
                                        className="w-full sm:w-auto flex-shrink-0 bg-blue-800/50 border border-blue-700 text-blue-300 font-bold py-1 px-4 rounded-sm transition-all duration-200 hover:bg-blue-700 hover:text-white disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700 disabled:cursor-not-allowed"
                                    >
                                        Sử Dụng
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 italic text-center py-8">Trống rỗng...</p>
            )}
        </div>
    );
};
