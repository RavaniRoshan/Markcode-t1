import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000'

export const listFiles = async (workspace: string): Promise<string[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/files/${workspace}`)
    return response.data
  } catch (error) {
    console.error('Failed to list files:', error)
    return []
  }
}

export const readFile = async (workspace: string, filename: string): Promise<string> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/file/${workspace}/${filename}`)
    return response.data.content
  } catch (error) {
    console.error('Failed to read file:', error)
    return ''
  }
}

export const saveFile = async (workspace: string, filename: string, content: string): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/file/${workspace}/${filename}`, { content })
  } catch (error) {
    console.error('Failed to save file:', error)
    throw error
  }
}

export const deleteFile = async (workspace: string, filename: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/file/${workspace}/${filename}`)
  } catch (error) {
    console.error('Failed to delete file:', error)
    throw error
  }
}