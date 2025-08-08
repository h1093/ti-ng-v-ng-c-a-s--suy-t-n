
import React, { useState, useEffect } from 'react';

interface AiConfig {
    source: 'default' | 'custom';
    keys: string[];
}

interface AiSourceManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    saveConfig: (source: 'default' | 'custom', keys: string[]) => void;
    getConfig: () => AiConfig & { currentIndex: number };
}

export const AiSourceManagerModal: React.FC<AiSourceManagerModalProps> = ({ isOpen, onClose, saveConfig, getConfig }) => {
  if (!isOpen) return null;

  const [currentConfig, setCurrentConfig] = useState<AiConfig>({ source: 'default', keys: [] });
  const [keysInput, setKeysInput] = useState('');
  
  useEffect(() => {
    if (isOpen) {
        const config = getConfig();
        setCurrentConfig(config);
        setKeysInput(config.keys.join('\n'));
    }
  }, [isOpen, getConfig]);

  const handleSelectDefault = () => {
    saveConfig('default', []);
    const newConfig = { ...getConfig() };
    setCurrentConfig(newConfig);
  };
  
  const handleSaveCustom = () => {
    const parsedKeys = keysInput.split('\n').map(k => k.trim()).filter(Boolean);
    if (parsedKeys.length === 0) {
        alert("Vui lòng nhập ít nhất một API Key.");
        return;
    }
    saveConfig('custom', parsedKeys);
    const newConfig = { ...getConfig() };
    setCurrentConfig(newConfig);
  }

  const isDefaultActive = currentConfig.source === 'default' || currentConfig.keys.length === 0;

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" 
        onClick={onClose} 
        role="dialog"
        aria-modal="true" 
        aria-labelledby="ai-manager-title"
    >
      <div className="w-full max-w-lg bg-[#202123] text-gray-200 rounded-lg shadow-2xl p-6 border border-gray-700 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center">
            <h2 id="ai-manager-title" className="text-2xl font-bold" style={{color: '#ff9d9d'}}>Quản Lý Nguồn AI</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl" aria-label="Đóng">&times;</button>
        </header>
        <main className="flex flex-col gap-4">
            <div className={`p-4 border rounded-lg transition-all ${isDefaultActive ? 'border-blue-500' : 'border-gray-600'}`}>
                <h3 className="font-bold text-lg mb-3 text-gray-300">Nguồn AI Mặc Định</h3>
                <button onClick={handleSelectDefault} className="w-full flex items-center justify-center gap-3 p-3 rounded-md bg-gray-700/60 hover:bg-gray-700/90 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                        <path d="M12 2.5L13.1875 5.59375L16.2812 6.78125L13.1875 7.96875L12 11L10.8125 7.96875L7.71875 6.78125L10.8125 5.59375L12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5.5 8.5L6.4375 10.8125L8.75 11.75L6.4375 12.6875L5.5 15L4.5625 12.6875L2.25 11.75L4.5625 10.8125L5.5 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 11.5L19.4375 13.8125L21.75 14.75L19.4375 15.6875L18.5 18L17.5625 15.6875L15.25 14.75L17.5625 13.8125L18.5 11.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Sử Dụng Gemini AI Mặc Định
                </button>
                 {isDefaultActive && <p className="text-center mt-2 text-blue-400 font-semibold">Đang hoạt động</p>}
            </div>

            <div className="flex items-center gap-4">
                <hr className="flex-grow border-gray-600" />
                <span className="text-gray-500">hoặc</span>
                <hr className="flex-grow border-gray-600" />
            </div>

            <div className={`p-4 border rounded-lg transition-all ${!isDefaultActive ? 'border-blue-500' : 'border-gray-600'}`}>
                <h3 className="font-bold text-lg mb-3 text-gray-300">Sử Dụng API Key Của Bạn</h3>
                <textarea 
                    value={keysInput} 
                    onChange={e => setKeysInput(e.target.value)} 
                    placeholder="dán api_key_1&#x0a;dán api_key_2&#x0a;..."
                    rows={4}
                    className="w-full bg-gray-900/80 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-2">
                    Nhập một hoặc nhiều API Key Gemini, mỗi key một dòng (sử dụng Shift + Enter để xuống dòng). API Key sẽ được lưu cục bộ. Ứng dụng sẽ tự động xoay vòng key nếu một key gặp lỗi.
                </p>
                <button onClick={handleSaveCustom} className="w-full mt-4 px-6 py-2 rounded-md bg-gray-700/60 hover:bg-gray-700/90 transition-colors font-semibold">
                    Lưu và Sử Dụng Các Key Này
                </button>
                {!isDefaultActive && <p className="text-center mt-2 text-blue-400 font-semibold">Đang hoạt động</p>}
            </div>
        </main>
        <footer className="flex justify-end gap-4 mt-2 border-t border-gray-700 pt-4">
            <button onClick={onClose} className="px-8 py-2 rounded-md bg-gray-600/70 hover:bg-gray-600 transition-colors">Đóng</button>
        </footer>
      </div>
    </div>
  );
};
