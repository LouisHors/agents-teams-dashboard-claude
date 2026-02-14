interface StatusBarProps {
  connected: boolean;
  messageCount: number;
  lastUpdate: string;
  watchPath?: string;
}

export function StatusBar({
  connected,
  messageCount,
  lastUpdate,
  watchPath = '~/.claude/teams/',
}: StatusBarProps) {
  return (
    <footer className="h-7 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-3 text-xs flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className={connected ? 'text-zinc-400' : 'text-rose-400'}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-500">Watching: {watchPath}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-zinc-500">{messageCount} messages</span>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-500">Last update: {lastUpdate}</span>
      </div>
    </footer>
  );
}
