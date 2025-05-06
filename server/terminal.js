import { WebSocket } from 'ws';
import os from 'os';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// We'll implement this after installing node-pty
// import pty from 'node-pty';

class TerminalManager {
    constructor() {
        this.terminals = new Map();
    }

    createTerminal(workspace) {
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        const workspacePath = join(process.cwd(), 'workspaces', workspace);

        // Ensure workspace directory exists
        if (!existsSync(workspacePath)) {
            mkdirSync(workspacePath, { recursive: true });
        }

        // We'll implement this after installing node-pty
        // const ptyProcess = pty.spawn(shell, [], {
        //     name: 'xterm-color',
        //     cols: 80,
        //     rows: 30,
        //     cwd: workspacePath,
        //     env: process.env
        // });

        // return ptyProcess;
    }

    handleConnection(ws, req) {
        const workspace = req.url.split('/').pop();
        
        if (!workspace) {
            ws.close(1008, 'Workspace not specified');
            return;
        }

        // Sanitize workspace name
        if (!/^[a-zA-Z0-9-_]+$/.test(workspace)) {
            ws.close(1008, 'Invalid workspace name');
            return;
        }

        const terminal = this.createTerminal(workspace);
        this.terminals.set(ws, terminal);

        ws.on('message', (data) => {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'input':
                    terminal.write(message.data);
                    break;
                case 'resize':
                    terminal.resize(message.cols, message.rows);
                    break;
            }
        });

        terminal.onData((data) => {
            ws.send(JSON.stringify({ type: 'output', data }));
        });

        ws.on('close', () => {
            terminal.kill();
            this.terminals.delete(ws);
        });
    }
}

export default TerminalManager; 