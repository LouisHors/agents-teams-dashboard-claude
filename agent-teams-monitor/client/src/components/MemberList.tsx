import { Settings, Plus, Star } from 'lucide-react';
import type { Member } from '../types';

interface MemberListProps {
  teamName: string | null;
  members: Member[];
  selectedMemberName: string | null;
  onSelectMember: (memberName: string) => void;
  loading?: boolean;
}

const avatarGradients = [
  'from-emerald-500 to-cyan-500',
  'from-blue-500 to-indigo-500',
  'from-purple-500 to-pink-500',
  'from-orange-500 to-red-500',
  'from-teal-500 to-green-500',
];

function getAvatarGradient(name: string): string {
  const index = name.charCodeAt(0) % avatarGradients.length;
  return avatarGradients[index];
}

function getInitials(name: string): string {
  return name
    .split('-')
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);
}

export function MemberList({
  teamName,
  members,
  selectedMemberName,
  onSelectMember,
  loading,
}: MemberListProps) {
  const onlineCount = members.filter((m) => m.tmuxPaneId || m.backendType === 'in-process').length;

  if (!teamName) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        Select a team to view members
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-zinc-100 truncate">{teamName}</h2>
          <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          {members.length} members • {onlineCount} online
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">No members yet</div>
        ) : (
          members.map((member) => {
            const isSelected = member.name === selectedMemberName;
            const isOnline = member.tmuxPaneId || member.backendType === 'in-process';
            const isLead = member.agentType === 'team-lead';

            return (
              <div
                key={member.agentId}
                onClick={() => onSelectMember(member.name)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-emerald-500/10 border-l-2 border-emerald-500 rounded-r-lg'
                    : 'hover:bg-zinc-800/50'
                }`}
              >
                <div className="relative">
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${getAvatarGradient(
                      member.name
                    )} rounded-full flex items-center justify-center text-sm font-bold text-white`}
                  >
                    {getInitials(member.name)}
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-zinc-900 rounded-full ${
                      isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`text-sm font-medium truncate ${
                        isSelected ? 'text-zinc-100' : 'text-zinc-300'
                      }`}
                    >
                      {member.name}
                    </p>
                    {isLead && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  </div>
                  <p className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {isOnline ? 'online' : 'offline'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-zinc-800">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-300 rounded-lg text-sm transition-colors">
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>
    </>
  );
}
