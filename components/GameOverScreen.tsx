
import React from 'react';

interface GameOverScreenProps {
    reason: string;
    onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ reason, onRestart }) => {
    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center p-8 bg-black/50 border border-red-900 shadow-2xl shadow-red-900/50 rounded-lg">
            <h1 className="text-6xl font-bold text-red-700 mb-4">BẠN ĐÃ CHẾT</h1>
            <p className="text-gray-300 text-lg italic mb-8 max-w-md">
                {reason || "Hành trình của bạn kết thúc tại đây, một linh hồn bị lãng quên nữa đã bị phế tích nuốt chửng."}
            </p>
            <button
                onClick={onRestart}
                className="bg-gray-700 border border-gray-600 text-gray-200 font-bold py-3 px-8 rounded-sm hover:bg-gray-600 hover:text-white transition-all duration-300"
            >
                Đối Mặt Với Bóng Tối Lần Nữa
            </button>
        </div>
    );
};
