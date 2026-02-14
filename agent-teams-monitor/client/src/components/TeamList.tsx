import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import type { Team } from '../types';

interface TeamListProps {
  teams: Team[];
  selectedTeamName: string | null;
  onSelectTeam: (teamName: string) => void;
  loading?: boolean;
}

export function TeamList({ teams, selectedTeamName, onSelectTeam, loading }: TeamListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Teams
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No teams found
          </div>
        ) : (
          filteredTeams.map((team) => {
            const isSelected = team.name === selectedTeamName;
            const memberCount = team.memberCount || 0;

            return (
              <div
                key={team.name}
                onClick={() => onSelectTeam(team.name)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/10 border-l-2 border-cyan-500 rounded-r-lg'
                    : 'hover:bg-zinc-800/50'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSelected ? 'bg-cyan-500 glow-cyan' : 'bg-emerald-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      isSelected ? 'text-zinc-100' : 'text-zinc-300'
                    }`}
                  >
                    {team.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {memberCount > 0 ? `${memberCount} members` : 'idle'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-zinc-800">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          New Team
        </button>
      </div>
    </>
  );
}
