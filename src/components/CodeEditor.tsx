import React, { useEffect, useRef } from 'react'
import { Editor } from '@monaco-editor/react'
import { useFileStore } from '../store/fileStore'
import { setupLSPClient, getLanguageFromFilename } from '../utils/lspClient'
import { editor } from 'monaco-editor'

interface CodeEditorProps {
  value?: string
  language?: string
}

export const CodeEditor = ({ 
  value = '// Hello, World!',
  language = 'typescript',
}: CodeEditorProps) => {
  const { activeFile, fileContents, setFileContent } = useFileStore()
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (editorRef.current && activeFile) {
      const language = getLanguageFromFilename(activeFile)
      setupLSPClient(language, editorRef.current).catch(console.error)
    }
  }, [activeFile])

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    if (activeFile) {
      const language = getLanguageFromFilename(activeFile)
      setupLSPClient(language, editor).catch(console.error)
    }
  }

  const handleChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      setFileContent(activeFile, value)
    }
  }

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage={language}
        value={activeFile ? fileContents[activeFile] : value}
        theme="vs-dark"
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          tabSize: 2,
          scrollBeyondLastLine: false,
          quickSuggestions: true,
          parameterHints: { enabled: true },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          wordBasedSuggestions: 'currentDocument'
        }}
      />
    </div>
  )
} 