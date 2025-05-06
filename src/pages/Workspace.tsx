import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { FileTree } from '../components/FileTree'
import { TabBar } from '../components/TabBar'
import { CodeEditor } from '../components/CodeEditor'

interface WorkspaceProps {
    onWorkspaceChange: (id: string) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ onWorkspaceChange }) => {
    const { id } = useParams<{ id: string }>();

    useEffect(() => {
        if (id) {
            onWorkspaceChange(id);
        }
    }, [id, onWorkspaceChange]);

    return (
        <div className="h-screen flex flex-col">
            {/* Top Bar */}
            <div className="h-10 bg-tab-bg border-b border-gray-700 flex items-center px-4">
                <div className="flex space-x-4">
                    <button className="hover:text-blue-400">File</button>
                    <button className="hover:text-blue-400">Edit</button>
                    <button className="hover:text-blue-400">View</button>
                    <button className="hover:text-blue-400">Go</button>
                    <button className="hover:text-blue-400">Run</button>
                    <button className="hover:text-blue-400">Terminal</button>
                    <button className="hover:text-blue-400">Help</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Sidebar */}
                <div className="sidebar">
                    <FileTree />
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col">
                    <TabBar />
                    <div className="flex-1">
                        <CodeEditor />
                    </div>
                </div>
            </div>
        </div>
    )
} 