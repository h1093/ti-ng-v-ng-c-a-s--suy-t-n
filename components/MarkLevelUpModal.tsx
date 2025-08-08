import React from 'react';
import { MarkLevelUpEvent, SystemAction } from '../types';

const deityColors: Record<string, { text: string; bg: string; border: string }> = {
    'Sylvian': { text: 'text-green-300', bg: 'bg-green-700/50', border: 'border-green-500' },
    'Gro-goroth': { text: 'text-red-300', bg: 'bg-red-700/50', border: 'border-red-500' },
    'Alll-mer': { text: 'text-yellow-300', bg: 'bg-yellow-700/50', border: 'border-yellow-500' },
    'Khaos, Đấng Hỗn Mang': { text: 'text-purple-300', bg: 'bg-purple-700/50', border: 'border-purple-500' },
    'Aethel, Người Dệt Hư Không': { text: 'text-gray-300', bg: 'bg-gray-700/50', border: 'border-gray-500' },
    'Lithos, Ý Chí Của Đá': { text: 'text-orange-400', bg: 'bg-orange-700/50', border: 'border-orange-500' }
};

const PATHS = [
    { name: 'Sức Mạnh', description: 'Tăng cường vĩnh viễn một chỉ số cốt lõi, củng cố thể chất hoặc tinh thần của bạn bằng quyền năng của thần linh.', icon: '💪' },
    { name: 'Quyền Năng', description: 'Học một kỹ năng mới độc quyền, một bí mật chỉ được ban cho những tín đồ trung thành nhất.', icon: '✨' },
    { name: 'Ảnh Hưởng', description: 'Chiêu mộ một tín đồ mới cho Thánh Địa của bạn, lan tỏa ảnh hưởng của vị thần và củng cố lực lượng của bạn.', icon: '👥' }
];

interface MarkLevelUpModalProps {
    event: MarkLevelUpEvent;
    onSystemAction: (action: SystemAction) => void;
}

export const MarkLevelUpModal: React.FC<MarkLevelUpModalProps> = ({ event, onSystemAction }) => {
    const colors = deityColors[event.deity] || { text: 'text-gray-300', bg: 'bg-gray-700/50', border: 'border-gray-500' };

    const handleSelectPath = (pathName: string) => {
        onSystemAction({
            type: 'CHOOSE_LEVEL_UP_PATH',
            payload: {
                deity: event.deity,
                path: pathName
            }
        });
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mark-levelup-title"
        >
            <div className={`w-full max-w-4xl flex flex-col bg-gray-900 border-2 ${colors.border} rounded-lg shadow-2xl shadow-red-900/30`}>
                <header className={`p-6 text-center border-b-2 ${colors.border}`}>
                    <h2 id="mark-levelup-title" className={`text-4xl font-bold ${colors.text}`}>Ấn Ký Thăng Cấp!</h2>
                    <p className="text-gray-300 mt-2">Lòng trung thành của bạn đã được đền đáp. {event.deity} đã ban cho bạn sức mạnh lớn hơn.</p>
                    <p className={`mt-1 font-bold text-xl ${colors.text}`}>Ấn Ký đạt cấp {event.newLevel}</p>
                </header>
                <main className="p-6">
                    <h3 className="text-center text-xl font-semibold text-gray-300 mb-6">Hãy chọn con đường của bạn:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {PATHS.map(path => (
                            <button
                                key={path.name}
                                onClick={() => handleSelectPath(path.name)}
                                className={`flex flex-col items-center p-6 text-center border-2 ${colors.border} rounded-lg bg-black/30 hover:bg-black/60 hover:shadow-lg hover:shadow-current transition-all duration-300 transform hover:-translate-y-1`}
                            >
                                <span className="text-5xl mb-4">{path.icon}</span>
                                <h4 className={`text-2xl font-bold ${colors.text}`}>{path.name}</h4>
                                <p className="text-gray-400 text-sm mt-2">{path.description}</p>
                            </button>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};
