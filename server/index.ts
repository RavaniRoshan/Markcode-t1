import express from 'express'
import cors from 'cors'
import { WebSocket, WebSocketServer } from 'ws'
import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  Logger,
  Connection,
  MessageReader,
  MessageWriter,
} from 'vscode-languageserver'
import { 
  WebSocketMessageReader, 
  WebSocketMessageWriter, 
  IWebSocket,
  createMessageConnection
} from 'vscode-ws-jsonrpc'
import { createServer } from 'http'
import { URL } from 'url'
import { lspServer } from './src/lspServer.js'
import { TextDocument } from 'vscode-languageserver-textdocument'

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Create HTTP server
const server = createServer(app)

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  path: '/lsp',
})

function toSocket(webSocket: WebSocket): IWebSocket {
  return {
    send: (content: string) => webSocket.send(content),
    onMessage: (callback: (data: string) => void) => {
      webSocket.on('message', (data: Buffer | string | any) => {
        if (Buffer.isBuffer(data)) {
          callback(data.toString('utf-8'))
        } else if (typeof data === 'string') {
          callback(data)
        } else {
          callback(JSON.stringify(data))
        }
      })
      return webSocket
    },
    onError: (callback: (error: Error) => void) => {
      webSocket.on('error', callback)
      return webSocket
    },
    onClose: (callback: (code: number, reason: string) => void) => {
      webSocket.on('close', (code: number, reason: string) => callback(code, reason))
      return webSocket
    },
    dispose: () => {
      webSocket.close()
    }
  }
}

wss.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`)
  const path = url.pathname

  if (path === '/lsp') {
    const socket = toSocket(ws)
    const messageReader = new WebSocketMessageReader(socket) as unknown as MessageReader
    const messageWriter = new WebSocketMessageWriter(socket) as unknown as MessageWriter

    // Create a JSON-RPC connection
    const jsonRpcConnection = createMessageConnection(messageReader, messageWriter)
    
    // Create an LSP connection
    const connection = createConnection(ProposedFeatures.all)

    // Forward messages between JSON-RPC and LSP connections
    jsonRpcConnection.onRequest((method, params) => {
      return connection.sendRequest(method, params)
    })

    jsonRpcConnection.onNotification((method, params) => {
      connection.sendNotification(method, params)
    })

    connection.onRequest((method, params) => {
      return jsonRpcConnection.sendRequest(method, params)
    })

    connection.onNotification((method, params) => {
      jsonRpcConnection.sendNotification(method, params)
    })

    // Create a text document manager
    const documents = new TextDocuments(TextDocument)

    // Make the text document manager listen on the connection
    documents.listen(connection)

    // Initialize the LSP server with the connection
    lspServer(connection)

    // Start listening on both connections
    jsonRpcConnection.listen()
    connection.listen()

    // Handle WebSocket close
    ws.on('close', () => {
      messageReader.dispose()
      messageWriter.dispose()
      jsonRpcConnection.dispose()
      connection.dispose()
    })
  }
})

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`)
}) 