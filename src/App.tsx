import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { Workspace } from './pages/Workspace'
import TopBar from './components/TopBar'
import Terminal from './components/Terminal'

function App() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState('default');

  const handleTerminalToggle = () => {
    setIsTerminalOpen(!isTerminalOpen);
  };

  return (
    <Router>
      <div className="flex flex-col h-screen">
        <TopBar 
          onTerminalToggle={handleTerminalToggle}
          isTerminalOpen={isTerminalOpen}
        />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route 
              path="/workspace/:id" 
              element={
                <Workspace 
                  onWorkspaceChange={(id) => setCurrentWorkspace(id)}
                />
              } 
            />
          </Routes>
        </div>
        <Terminal 
          workspace={currentWorkspace}
          isOpen={isTerminalOpen}
        />
      </div>
    </Router>
  )
}

export default App 