import { create } from 'zustand'
import { saveFile } from '../utils/fileSystem'
import debounce from 'lodash.debounce'

interface FileStore {
  currentOpenFiles: string[]
  activeFile: string | null
  fileContents: Record<string, string>
  saveStatus: Record<string, 'saved' | 'saving' | 'unsaved'>
  workspace: string
  openFile: (name: string, content?: string) => void
  closeFile: (name: string) => void
  setActiveFile: (name: string) => void
  setFileContent: (filename: string, content: string) => void
  saveFile: (filename: string) => Promise<void>
  setWorkspace: (workspace: string) => void
}

const debouncedSave = debounce(async (
  workspace: string,
  filename: string,
  content: string,
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void
) => {
  try {
    setSaveStatus('saving')
    await saveFile(workspace, filename, content)
    setSaveStatus('saved')
  } catch (error) {
    console.error('Failed to save file:', error)
    setSaveStatus('unsaved')
  }
}, 2000)

export const useFileStore = create<FileStore>((set, get) => ({
  currentOpenFiles: [],
  activeFile: null,
  fileContents: {},
  saveStatus: {},
  workspace: 'default',
  
  openFile: (name, content = '') => set((state) => ({
    currentOpenFiles: state.currentOpenFiles.includes(name)
      ? state.currentOpenFiles
      : [...state.currentOpenFiles, name],
    activeFile: name,
    fileContents: { ...state.fileContents, [name]: content },
    saveStatus: { ...state.saveStatus, [name]: 'saved' }
  })),
  
  closeFile: (name) => set((state) => {
    const newFiles = state.currentOpenFiles.filter(file => file !== name)
    const newContents = { ...state.fileContents }
    const newSaveStatus = { ...state.saveStatus }
    delete newContents[name]
    delete newSaveStatus[name]
    
    return {
      currentOpenFiles: newFiles,
      activeFile: state.activeFile === name
        ? newFiles[newFiles.length - 1] || null
        : state.activeFile,
      fileContents: newContents,
      saveStatus: newSaveStatus
    }
  }),
  
  setActiveFile: (name) => set({ activeFile: name }),
  
  setFileContent: (filename, content) => {
    const state = get()
    set((state) => ({
      fileContents: { ...state.fileContents, [filename]: content },
      saveStatus: { ...state.saveStatus, [filename]: 'unsaved' }
    }))
    
    debouncedSave(
      state.workspace,
      filename,
      content,
      (status) => set((state) => ({
        saveStatus: { ...state.saveStatus, [filename]: status }
      }))
    )
  },
  
  saveFile: async (filename) => {
    const state = get()
    const content = state.fileContents[filename]
    if (!content) return
    
    set((state) => ({
      saveStatus: { ...state.saveStatus, [filename]: 'saving' }
    }))
    
    try {
      await saveFile(state.workspace, filename, content)
      set((state) => ({
        saveStatus: { ...state.saveStatus, [filename]: 'saved' }
      }))
    } catch (error) {
      console.error('Failed to save file:', error)
      set((state) => ({
        saveStatus: { ...state.saveStatus, [filename]: 'unsaved' }
      }))
    }
  },
  
  setWorkspace: (workspace) => set({ workspace })
}))