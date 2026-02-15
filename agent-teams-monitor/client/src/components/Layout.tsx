import { useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

type PanelTab = 'network' | 'tasks';

interface LayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  memberList: ReactNode;
  messagePanel: ReactNode;
  networkPanel: ReactNode;
  taskPanel: ReactNode;
  statusBar: ReactNode;
}

const MIN_NETWORK_HEIGHT = 50;
const DEFAULT_NETWORK_HEIGHT = 280;

export function Layout({ header, sidebar, memberList, messagePanel, networkPanel, taskPanel, statusBar }: LayoutProps) {
  const [networkHeight, setNetworkHeight] = useState(DEFAULT_NETWORK_HEIGHT);
  const [activeTab, setActiveTab] = useState<PanelTab>('network');
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = networkHeight;
  }, [networkHeight]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerHeight = containerRect.height;
    const deltaY = startYRef.current - e.clientY;
    const newHeight = Math.max(
      MIN_NETWORK_HEIGHT,
      Math.min(startHeightRef.current + deltaY, containerHeight - 100)
    );
    setNetworkHeight(newHeight);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-50 overflow-hidden">
      {/* Header */}
      {header}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Teams */}
        <aside className="w-60 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
          {sidebar}
        </aside>

        {/* Middle Sidebar: Members */}
        <aside className="w-64 flex-shrink-0 bg-zinc-900/50 border-r border-zinc-800 flex flex-col">
          {memberList}
        </aside>

        {/* Right Area: Messages + Network */}
        <div ref={containerRef} className="flex-1 flex flex-col min-w-0">
          {/* Messages Panel */}
          <main className="flex-1 flex flex-col bg-zinc-950 min-h-0 overflow-hidden">
            {messagePanel}
          </main>

          {/* Resizer Handle */}
          <div
            className={`
              h-3 bg-zinc-900 border-t border-b border-zinc-700
              flex items-center justify-center cursor-ns-resize
              hover:bg-zinc-800 hover:border-zinc-600
              transition-colors duration-150
              ${isDragging ? 'bg-zinc-700 border-cyan-500/50' : ''}
            `}
            onMouseDown={handleMouseDown}
          >
            {/* Drag Handle Indicator */}
            <div className="flex gap-1">
              <div className={`w-8 h-1 rounded-full ${isDragging ? 'bg-cyan-500' : 'bg-zinc-600'}`} />
            </div>
          </div>

          {/* Network Graph / Task Board Panel */}
          <div
            className="flex-shrink-0 bg-zinc-900 border-t border-zinc-800 relative overflow-hidden flex flex-col"
            style={{ height: networkHeight }}
          >
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800 bg-zinc-900">
              <button
                onClick={() => setActiveTab('network')}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
                  ${activeTab === 'network'
                    ? 'bg-zinc-800 text-cyan-400 border border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                  }
                `}
              >
                网络图
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
                  ${activeTab === 'tasks'
                    ? 'bg-zinc-800 text-cyan-400 border border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                  }
                `}
              >
                任务看板
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'network' ? networkPanel : taskPanel}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      {statusBar}
    </div>
  );
}
