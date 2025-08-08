
import React from 'react';

interface StatDisplayProps {
    label: string;
    value: number;
    maxValue: number;
    color: string;
    className?: string;
}

export const StatDisplay: React.FC<StatDisplayProps> = ({ label, value, maxValue, color, className }) => {
    const percentage = Math.max(0, (value / maxValue) * 100);

    return (
        <div className={`w-full ${className}`}>
            <div className="flex justify-between items-center mb-1 text-sm font-bold">
                <span className="text-gray-300">{label}</span>
                <span className="text-gray-400">{value} / {maxValue}</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2.5 border border-gray-600">
                <div className={`h-full rounded-full transition-all duration-500 ease-in-out ${color}`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};
