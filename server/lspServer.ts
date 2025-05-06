import { spawn } from 'child_process'
import { WebSocketServer } from 'ws'
import { createConnection } from 'vscode-languageserver/node'
import { createMessageConnection } from 'vscode-ws-jsonrpc'
import { MessageConnection } from 'vscode-jsonrpc'

const LSP_PROCESSES = new Map<string, any>()

function startLSPProcess(language: string): MessageConnection {
  let lspProcess
  switch (language) {
    case 'typescript':
    case 'javascript':
      lspProcess = spawn('typescript-language-server', ['--stdio'])
      break
    case 'python':
      lspProcess = spawn('pylsp')
      break
    case 'html':
      lspProcess = spawn('html-language-server', ['--stdio'])
      break
    default:
      throw new Error(`Unsupported language: ${language}`)
  }

  const connection = createConnection(
    lspProcess.stdout,
    lspProcess.stdin
  )

  connection.listen()
  return connection
}

export function setupLSPServer(port: number = 3001) {
  const wss = new WebSocketServer({ port })

  wss.on('connection', (ws) => {
    let language: string | null = null
    let lspConnection: MessageConnection | null = null

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message)
        
        // Handle initialization message
        if (data.type === 'init') {
          language = data.language
          if (!LSP_PROCESSES.has(language)) {
            lspConnection = startLSPProcess(language)
            LSP_PROCESSES.set(language, lspConnection)
          } else {
            lspConnection = LSP_PROCESSES.get(language)
          }

          // Set up message forwarding from LSP to WebSocket
          lspConnection.onNotification((method, params) => {
            ws.send(JSON.stringify({ method, params }))
          })

          lspConnection.onRequest((method, params) => {
            return new Promise((resolve) => {
              ws.send(JSON.stringify({ method, params, id: Date.now() }))
              // Handle response in a separate message handler
            })
          })
        }

        // Forward message to LSP
        if (lspConnection) {
          if (data.method) {
            if (data.id) {
              // Handle request
              lspConnection.sendRequest(data.method, data.params)
                .then(result => {
                  ws.send(JSON.stringify({ id: data.id, result }))
                })
                .catch(error => {
                  ws.send(JSON.stringify({ id: data.id, error }))
                })
            } else {
              // Handle notification
              lspConnection.sendNotification(data.method, data.params)
            }
          }
        }
      } catch (error) {
        console.error('Error handling message:', error)
      }
    })

    ws.on('close', () => {
      // Clean up if needed
      if (language && LSP_PROCESSES.has(language)) {
        const connection = LSP_PROCESSES.get(language)
        connection.dispose()
        LSP_PROCESSES.delete(language)
      }
    })
  })

  console.log(`LSP WebSocket server running on ws://localhost:${port}`)
} 