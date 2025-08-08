
import React, { useState } from 'react';

interface SidePanelAccordionProps {
    title: string;
    children: React.ReactNode;
    initialOpen?: boolean;
}

export const SidePanelAccordion: React.FC<SidePanelAccordionProps> = ({ title, children, initialOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const contentId = `accordion-content-${title.replace(/\s+/g, '-')}`;

    return (
        <div className="border border-gray-700/50 rounded-md bg-black/20 overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center p-3 bg-gray-900/50 hover:bg-gray-800/60 transition-colors duration-200"
                aria-expanded={isOpen}
                aria-controls={contentId}
            >
                <h3 className="font-bold text-gray-300 text-base">{title}</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div id={contentId} className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
                <div className="p-3">
                    {children}
                </div>
            </div>
        </div>
    );
};
