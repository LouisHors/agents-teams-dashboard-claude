import { useEffect, useRef, useState } from 'react';
import { MoreVertical, ClipboardList, Send, Paperclip, Smile } from 'lucide-react';
import { MessageItem } from './MessageItem';
import type { Member, Message } from '../types';

interface MessagePanelProps {
  member: Member | null;
  messages: Message[];
  currentUser: string;
  onSendMessage?: (content: string) => void;
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

export function MessagePanel({ member, messages, currentUser, onSendMessage }: MessagePanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!member) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-sm">Select a member to view messages</p>
        </div>
      </div>
    );
  }

  const isOnline = member.tmuxPaneId || member.backendType === 'in-process';

  return (
    <>
      {/* Message Header */}
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-8 h-8 bg-gradient-to-br ${getAvatarGradient(
                member.name
              )} rounded-full flex items-center justify-center text-xs font-bold text-white`}
            >
              {getInitials(member.name)}
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-zinc-950 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
              }`}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-100">{member.name}</p>
            <p className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {isOnline ? 'online' : 'offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
            <ClipboardList className="w-5 h-5" />
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            No messages yet. Start a conversation!
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageItem
                key={`${message.timestamp}-${index}`}
                message={message}
                isOwn={message.from === currentUser}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-zinc-800 flex-shrink-0">
        <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
          <button className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none"
          />
          <button className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
