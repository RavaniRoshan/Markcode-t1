import React from 'react';

interface TopBarProps {
    onTerminalToggle: () => void;
    isTerminalOpen: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ onTerminalToggle, isTerminalOpen }) => {
    return (
        <div className="bg-gray-800 text-white p-2 flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold">Markcode</h1>
            </div>
            <div className="flex items-center space-x-4">
                <button
                    onClick={onTerminalToggle}
                    className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                    title={isTerminalOpen ? "Close Terminal" : "Open Terminal"}
                >
                    {isTerminalOpen ? "▼ Terminal" : "▲ Terminal"}
                </button>
            </div>
        </div>
    );
};

export default TopBar; 