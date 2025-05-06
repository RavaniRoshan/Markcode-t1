declare module 'monaco-languageclient' {
  export class MonacoLanguageClient {
    constructor(options: any)
    start(): void
    stop(): void
    sendRequest(method: string, params: any): Promise<any>
  }

  export enum CloseAction {
    Restart = 'restart',
    Stop = 'stop'
  }

  export enum ErrorAction {
    Continue = 'continue',
    Stop = 'stop'
  }
}

declare module 'vscode-ws-jsonrpc' {
  export function createConnection(reader: any, writer: any): any
  export class WebSocketMessageReader {
    constructor(socket: WebSocket)
  }
  export class WebSocketMessageWriter {
    constructor(socket: WebSocket)
  }
}

declare module 'vscode-jsonrpc' {
  export interface MessageConnection {
    listen(): void
    send(data: any): void
    sendRequest(method: string, params: any): Promise<any>
    sendNotification(method: string, params: any): void
    onNotification(handler: (method: string, params: any) => void): void
    onRequest(handler: (method: string, params: any) => Promise<any>): void
    onClose(handler: () => void): void
    dispose(): void
  }
} 