import React, { useEffect } from 'react'
import { useFileStore } from '../store/fileStore'

export const TabBar = () => {
  const { currentOpenFiles, activeFile, setActiveFile, closeFile, saveFile, saveStatus } = useFileStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (activeFile) {
          saveFile(activeFile)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeFile, saveFile])

  const getSaveStatusIcon = (filename: string) => {
    const status = saveStatus[filename]
    switch (status) {
      case 'saving':
        return '⏳'
      case 'unsaved':
        return '●'
      default:
        return ''
    }
  }

  return (
    <div className="flex bg-tab-bg border-b border-gray-700">
      {currentOpenFiles.map((file) => (
        <div
          key={file}
          className={`tab ${activeFile === file ? 'tab-active' : ''}`}
          onClick={() => setActiveFile(file)}
        >
          <span className="flex items-center gap-2">
            {file}
            <span className="text-xs">{getSaveStatusIcon(file)}</span>
          </span>
          <button
            className="ml-2 hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation()
              closeFile(file)
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
} 