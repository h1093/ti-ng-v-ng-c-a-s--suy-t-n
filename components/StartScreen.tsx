import React from 'react';

interface StartScreenProps {
    onStart: (mode: 'standard' | 'custom') => void;
    hasSave: boolean;
    onContinue: () => void;
    onStartCombatSandbox: () => void;
    enableGore: boolean;
    onGoreToggle: (enabled: boolean) => void;
    onOpenAiManager: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, hasSave, onContinue, onStartCombatSandbox, enableGore, onGoreToggle, onOpenAiManager }) => {
    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center p-6 bg-black/50 border border-gray-800 shadow-2xl shadow-red-900/20 rounded-lg">
            <h1 className="text-5xl font-bold text-red-600 mb-2 tracking-wider">Tiếng Vọng Của Sự Suy Tàn</h1>
            <p className="text-gray-400 mb-8 max-w-lg">
                Các vị thần cổ xưa đã chết, xác của họ nuôi dưỡng những con giòi đang quằn quại trong nền móng của thế giới. Bạn đến đây vì một thứ gì đó... kho báu, sự cứu rỗi, hoặc có lẽ chỉ là một cái chết huy hoàng. Bạn có thể chỉ tìm thấy sự điên loạn.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                {hasSave && (
                    <button onClick={onContinue} className="bg-transparent border-2 border-gray-400 text-gray-300 font-bold py-3 px-8 rounded-sm hover:bg-gray-400 hover:text-black transition-all duration-300 transform hover:scale-105">
                        Tiếp Tục Hành Trình
                    </button>
                )}
                <button onClick={() => onStart('standard')} className="bg-transparent border-2 border-red-600 text-red-500 font-bold py-3 px-8 rounded-sm hover:bg-red-600 hover:text-black transition-all duration-300 transform hover:scale-105">
                    {hasSave ? "Bắt Đầu Lại" : "Bước vào U Tối"}
                </button>
                <button onClick={() => onStart('custom')} className="bg-transparent border-2 border-purple-500 text-purple-400 font-bold py-3 px-8 rounded-sm hover:bg-purple-500 hover:text-black transition-all duration-300 transform hover:scale-105">
                    Tạo Hành Trình Riêng
                </button>
                 <button onClick={onStartCombatSandbox} className="bg-transparent border-2 border-yellow-500 text-yellow-400 font-bold py-3 px-8 rounded-sm hover:bg-yellow-500 hover:text-black transition-all duration-300 transform hover:scale-105">
                    Thử Nghiệm Chiến Đấu
                </button>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-800 w-full max-w-lg text-left">
                <h2 className="text-xl font-bold text-yellow-400 mb-3 text-center">Nhật Ký Cập Nhật: Tiếng Vọng Từ Hư Không</h2>
                <ul className="text-sm text-gray-400 list-disc list-inside space-y-2 bg-black/20 p-4 rounded-md border border-gray-700/50">
                    <li><span className="font-semibold text-gray-300">Số Phận Nghiệt Ngã Hơn Cái Chết:</span> Một "bad ending" mới đã được thêm vào. Không phải mọi kết thúc đều là sự giải thoát.</li>
                    <li><span className="font-semibold text-gray-300">Hệ Thống Kỹ Năng Tiến Triển:</span> Các kỹ năng đặc biệt như Tử Linh Sư và Thuần Thú Sư giờ đây có thể được rèn luyện và lên cấp!</li>
                    <li><span className="font-semibold text-gray-300">Quản lý Nguồn AI:</span> Giờ bạn có thể sử dụng API Key của riêng mình. Nhấn nút 'Quản Lý Nguồn AI' bên dưới.</li>
                    <li><span className="font-semibold text-gray-300">Các Ngoại Thần đã thức tỉnh:</span> Ba thực thể nguyên thủy mới đã được thêm vào thế giới, mang theo những cơ hội và hiểm nguy khó lường (Khaos, Aethel, Lithos).</li>
                </ul>
            </div>
             <div className="mt-8 pt-4 border-t border-gray-800 w-full max-w-sm flex flex-col items-center justify-center gap-4">
                 <button onClick={onOpenAiManager} className="bg-transparent border-2 border-blue-500 text-blue-400 font-bold py-2 px-6 rounded-sm hover:bg-blue-500 hover:text-black transition-all duration-300 transform hover:scale-105">
                    Quản Lý Nguồn AI
                </button>
                <div className="mt-4 flex items-center justify-center gap-4">
                    <label htmlFor="gore-toggle" className="text-gray-400">Nội dung 18+:</label>
                    <div onClick={() => onGoreToggle(!enableGore)} className="relative inline-flex items-center cursor-pointer" id="gore-toggle" role="switch" aria-checked={enableGore}>
                        <div className="w-11 h-6 bg-gray-600 rounded-full"></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${enableGore ? 'transform translate-x-5 bg-red-500' : ''}`}></div>
                    </div>
                    <span className={`font-bold ${enableGore ? 'text-red-500' : 'text-gray-500'}`}>{enableGore ? 'BẬT' : 'TẮT'}</span>
                </div>
            </div>
        </div>
    );
};