import type { ReactNode } from 'react';

interface LayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  memberList: ReactNode;
  messagePanel: ReactNode;
  statusBar: ReactNode;
}

export function Layout({ header, sidebar, memberList, messagePanel, statusBar }: LayoutProps) {
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

        {/* Right Panel: Messages */}
        <main className="flex-1 flex flex-col bg-zinc-950 min-w-0">
          {messagePanel}
        </main>
      </div>

      {/* Footer Status Bar */}
      {statusBar}
    </div>
  );
}
