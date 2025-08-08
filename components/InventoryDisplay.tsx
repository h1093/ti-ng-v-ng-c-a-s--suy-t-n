
import React from 'react';

interface InventoryDisplayProps {
    inventory: Record<string, number>;
}

export const InventoryDisplay: React.FC<InventoryDisplayProps> = ({ inventory }) => {
    const items = Object.entries(inventory);
    
    return (
        <div className="p-4">
            <h3 className="font-bold text-gray-300 text-xl mb-4 text-center sr-only">Túi Đồ</h3>
            {items.length > 0 ? (
                <ul className="text-sm text-gray-300 space-y-2">
                    {items.map(([name, quantity]) => (
                        <li key={name} className="flex justify-between items-center bg-black/20 p-3 rounded-md border border-gray-700/50">
                            <span className="font-semibold">{name}</span>
                            <span className="font-bold text-lg text-gray-400">x{quantity}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 italic text-center py-8">Trống rỗng...</p>
            )}
        </div>
    );
};
