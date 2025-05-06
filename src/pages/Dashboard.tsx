import React from 'react'
import { Link } from 'react-router-dom'

export const Dashboard = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-editor-bg">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Welcome to Markcode</h1>
        <Link
          to="/workspace"
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
        >
          Open Workspace
        </Link>
      </div>
    </div>
  )
} 