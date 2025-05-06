import express from 'express'
import cors from 'cors'
import { WebSocket, WebSocketServer } from 'ws'
import {
  createConnection,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  Logger,
  ProtocolConnection,
  TextDocuments
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createServer } from 'http'
import { URL } from 'url'
import { WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc'
import { lspServer } from './src/lspServer.js'
import dotenv from 'dotenv'
import { Client } from 'pg'

dotenv.config();

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

wss.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`)
  const path = url.pathname

  if (path === '/lsp') {
    const socket = {
      send: (content: string) => ws.send(content),
      onMessage: (cb: (data: string) => void) => {
        ws.on('message', (data) => {
          const content = Buffer.isBuffer(data) ? data.toString() : data
          cb(typeof content === 'string' ? content : JSON.stringify(content))
        })
      },
      onError: (cb: (error: Error) => void) => ws.on('error', cb),
      onClose: (cb: (code: number, reason: string) => void) => ws.on('close', (code, reason) => {
        const reasonStr = Buffer.isBuffer(reason) ? reason.toString('utf-8') : String(reason || '')
        cb(code, reasonStr)
      }),
      dispose: () => ws.close()
    }

    const reader = new WebSocketMessageReader(socket)
    const writer = new WebSocketMessageWriter(socket)

    // Create connection with proper message transport
    const messageTransport = {
      reader,
      writer
    }
    const connection = createConnection(messageTransport, ProposedFeatures.all)
    
    // Setup document manager
    const documents = new TextDocuments(TextDocument)
    documents.listen(connection)

    // Initialize the LSP server
    lspServer(connection as any)

    // Start listening
    connection.listen()

    // Handle cleanup
    ws.on('close', () => {
      reader.dispose()
      writer.dispose()
      connection.dispose()
    })
  }
})

// PostgreSQL client setup
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testConnection() {
  try {
    await client.connect();
    console.log('Connected to Neon Postgres!');
    const res = await client.query('SELECT NOW()');
    console.log('Server time:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

testConnection()

// Sample API endpoint to get current time from Neon Postgres
app.get('/api/time', async (req, res) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    await client.end();
    res.json({ time: result.rows[0].now });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: 'Database error', details: err.message });
    } else {
      res.status(500).json({ error: 'Database error', details: String(err) });
    }
  }
});

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})