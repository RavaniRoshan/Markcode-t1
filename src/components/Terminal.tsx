import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
    workspace: string;
    isOpen: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ workspace, isOpen }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    useEffect(() => {
        if (!terminalRef.current || !isOpen) return;

        // Initialize xterm
        const term = new XTerm({
            cursorBlink: true,
            theme: {
                background: '#1e1e1e',
                foreground: '#ffffff',
                cursor: '#00ff00',
            },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Connect to WebSocket
        const ws = new WebSocket(`ws://localhost:3000/api/terminals/${workspace}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'output') {
                term.write(message.data);
            }
        };

        term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'input', data }));
            }
        });

        // Handle resize
        const handleResize = () => {
            if (fitAddonRef.current) {
                fitAddonRef.current.fit();
                const { cols, rows } = term;
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'resize', cols, rows }));
                }
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            term.dispose();
            ws.close();
            window.removeEventListener('resize', handleResize);
        };
    }, [workspace, isOpen]);

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 bg-[#1e1e1e] transition-all duration-300 ease-in-out ${
                isOpen ? 'h-64' : 'h-0'
            }`}
        >
            <div ref={terminalRef} className="h-full w-full" />
        </div>
    );
};

export default Terminal; 