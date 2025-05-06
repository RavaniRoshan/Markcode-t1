import { MonacoLanguageClient, CloseAction, ErrorAction } from 'monaco-languageclient'
import { createConnection } from 'vscode-ws-jsonrpc'
import { WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc'
import type { MessageConnection } from 'vscode-jsonrpc'
import { editor } from 'monaco-editor'
import * as monaco from 'monaco-editor'

const LSP_CONNECTIONS = new Map<string, MonacoLanguageClient>()

export async function setupLSPClient(
  language: string,
  editor: editor.IStandaloneCodeEditor
): Promise<MonacoLanguageClient | null> {
  if (LSP_CONNECTIONS.has(language)) {
    return LSP_CONNECTIONS.get(language)!
  }

  try {
    const socket = new WebSocket('ws://localhost:3001')
    
    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => resolve()
      socket.onerror = (error) => reject(error)
    })

    // Initialize the connection
    socket.send(JSON.stringify({
      type: 'init',
      language
    }))

    const reader = new WebSocketMessageReader(socket)
    const writer = new WebSocketMessageWriter(socket)
    const connection = createConnection(reader, writer)

    const languageClient = new MonacoLanguageClient({
      name: `${language}-client`,
      clientOptions: {
        documentSelector: [{ language }],
        errorHandler: {
          error: () => ErrorAction.Continue,
          closed: () => CloseAction.Restart
        },
        workspaceFolder: {
          uri: 'file:///workspace',
          name: 'workspace'
        },
        synchronize: {
          fileEvents: [
            monaco.Uri.file('/workspace/**')
          ]
        }
      },
      connectionProvider: {
        get: () => Promise.resolve(connection)
      }
    })

    // Register language features
    languageClient.start()
    connection.onClose(() => {
      languageClient.stop()
      LSP_CONNECTIONS.delete(language)
    })

    // Register Monaco features
    editor.updateOptions({
      quickSuggestions: true,
      parameterHints: { enabled: true },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      wordBasedSuggestions: 'currentDocument'
    })

    // Register language-specific features
    monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ['.', '"', "'", '`', '/', '@', '<', '#', ' '],
      provideCompletionItems: async (model, position) => {
        const result = await languageClient.sendRequest('textDocument/completion', {
          textDocument: { uri: model.uri.toString() },
          position: { line: position.lineNumber - 1, character: position.column - 1 }
        })
        return result
      }
    })

    monaco.languages.registerHoverProvider(language, {
      provideHover: async (model, position) => {
        const result = await languageClient.sendRequest('textDocument/hover', {
          textDocument: { uri: model.uri.toString() },
          position: { line: position.lineNumber - 1, character: position.column - 1 }
        })
        return result
      }
    })

    LSP_CONNECTIONS.set(language, languageClient)
    return languageClient
  } catch (error) {
    console.error(`Failed to setup LSP for ${language}:`, error)
    return null
  }
}

export function getLanguageFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'py':
      return 'python'
    case 'html':
      return 'html'
    case 'json':
      return 'json'
    default:
      return 'plaintext'
  }
} 