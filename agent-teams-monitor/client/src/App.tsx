import { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, Bell, User } from 'lucide-react';
import { Layout } from './components/Layout';
import { TeamList } from './components/TeamList';
import { MemberList } from './components/MemberList';
import { MessagePanel } from './components/MessagePanel';
import { StatusBar } from './components/StatusBar';
import { useTeams, useTeamMembers, useMemberMessages } from './hooks/useTeams';
import { useSocket } from './hooks/useSocket';
import type { Message } from './types';

function App() {
  // Selection state
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null);

  // Data fetching
  const { teams, loading: teamsLoading } = useTeams();
  const { members, loading: membersLoading } = useTeamMembers(selectedTeamName);
  const { messages, loading: messagesLoading, addMessage } = useMemberMessages(
    selectedTeamName,
    selectedMemberName
  );

  // Socket connection
  const { connected, subscribeToTeam, subscribeToMember } = useSocket();

  // Subscribe to team and member updates via socket
  useEffect(() => {
    if (selectedTeamName) {
      subscribeToTeam(selectedTeamName);
    }
  }, [selectedTeamName, subscribeToTeam]);

  useEffect(() => {
    if (selectedTeamName && selectedMemberName) {
      subscribeToMember(selectedTeamName, selectedMemberName);
    }
  }, [selectedTeamName, selectedMemberName, subscribeToMember]);

  // Handle team selection
  const handleSelectTeam = useCallback((teamName: string) => {
    setSelectedTeamName(teamName);
    setSelectedMemberName(null);
  }, []);

  // Handle member selection
  const handleSelectMember = useCallback((memberName: string) => {
    setSelectedMemberName(memberName);
  }, []);

  // Handle sending message
  const handleSendMessage = useCallback(
    (content: string) => {
      const newMessage: Message = {
        from: 'you',
        text: content,
        timestamp: new Date().toISOString(),
      };
      addMessage(newMessage);
    },
    [addMessage]
  );

  // Get current member object
  const currentMember = useMemo(
    () => members.find((m) => m.name === selectedMemberName) || null,
    [members, selectedMemberName]
  );

  // Format last update time
  const lastUpdate = useMemo(() => {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }, [messages.length]);

  // Header component
  const header = (
    <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-semibold text-lg tracking-tight">Agent Teams Monitor</h1>
        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
          LIVE
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );

  return (
    <Layout
      header={header}
      sidebar={
        <TeamList
          teams={teams}
          selectedTeamName={selectedTeamName}
          onSelectTeam={handleSelectTeam}
          loading={teamsLoading}
        />
      }
      memberList={
        <MemberList
          teamName={selectedTeamName}
          members={members}
          selectedMemberName={selectedMemberName}
          onSelectMember={handleSelectMember}
          loading={membersLoading}
        />
      }
      messagePanel={
        <MessagePanel
          member={currentMember}
          messages={messages}
          currentUser="you"
          onSendMessage={handleSendMessage}
          loading={messagesLoading}
        />
      }
      statusBar={
        <StatusBar
          connected={connected}
          messageCount={messages.length}
          lastUpdate={lastUpdate}
        />
      }
    />
  );
}

export default App;
