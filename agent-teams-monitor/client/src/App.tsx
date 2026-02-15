import { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, Bell, User } from 'lucide-react';
import { Layout } from './components/Layout';
import { TeamList } from './components/TeamList';
import { MemberList } from './components/MemberList';
import { MessagePanel } from './components/MessagePanel';
import { NetworkGraph } from './components/NetworkGraph';
import { StatusBar } from './components/StatusBar';
import { useTeams, useTeamMembers, useMemberMessages, useAllTeamMessages } from './hooks/useTeams';
import { useSocket } from './hooks/useSocket';
import { useTasks } from './hooks/useTasks';
import { TaskBoard } from './components/TaskBoard';
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

  // Fetch all team messages for network graph
  const { allMessages } = useAllTeamMessages(selectedTeamName, members);

  // Socket connection
  const { socket, connected, subscribeToTeam, subscribeToMember } = useSocket();

  // Tasks
  const { tasks, isLoading: tasksLoading } = useTasks(socket, selectedTeamName);

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

  // Get current team config for lead agent id
  const currentTeam = useMemo(
    () => teams.find((t) => t.name === selectedTeamName),
    [teams, selectedTeamName]
  );

  // Handle node click in network graph
  const handleNodeClick = useCallback((memberName: string) => {
    setSelectedMemberName(memberName);
  }, []);

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
      networkPanel={
        <NetworkGraph
          members={members}
          leadAgentId={currentTeam?.leadAgentId}
          messages={messages}
          allTeamMessages={allMessages}
          teamName={selectedTeamName}
          selectedMemberName={selectedMemberName}
          onNodeClick={handleNodeClick}
        />
      }
      taskPanel={
        <TaskBoard
          tasks={tasks}
          isLoading={tasksLoading}
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
