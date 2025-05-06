import React, { useEffect, useState } from 'react'
import { useFileStore } from '../store/fileStore'
import { listFiles, readFile, deleteFile } from '../utils/fileSystem'

export const FileTree = () => {
  const { workspace, openFile } = useFileStore()
  const [files, setFiles] = useState<string[]>([])
  const [newFileName, setNewFileName] = useState('')
  const [showNewFileInput, setShowNewFileInput] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [workspace])

  const loadFiles = async () => {
    const fileList = await listFiles(workspace)
    setFiles(fileList)
  }

  const handleFileClick = async (filename: string) => {
    const content = await readFile(workspace, filename)
    openFile(filename, content)
  }

  const handleDeleteFile = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
      try {
        await deleteFile(workspace, filename)
        await loadFiles()
      } catch (error) {
        console.error('Failed to delete file:', error)
      }
    }
  }

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFileName) return

    try {
      await openFile(newFileName, '')
      setNewFileName('')
      setShowNewFileInput(false)
      await loadFiles()
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-semibold">Files</div>
        <button
          className="text-blue-400 hover:text-blue-300"
          onClick={() => setShowNewFileInput(true)}
        >
          + New File
        </button>
      </div>

      {showNewFileInput && (
        <form onSubmit={handleCreateFile} className="mb-4">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
            placeholder="Enter filename..."
            autoFocus
          />
        </form>
      )}

      <div className="space-y-1">
        {files.map((file) => (
          <div
            key={file}
            className="text-sm hover:bg-gray-700 px-2 py-1 rounded cursor-pointer flex justify-between items-center group"
            onClick={() => handleFileClick(file)}
          >
            <span>{file}</span>
            <button
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
              onClick={(e) => handleDeleteFile(file, e)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
} 