import { Code } from 'lucide-react';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isOwn?: boolean;
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

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function isProtocolMessage(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return typeof parsed === 'object' && parsed !== null && 'type' in parsed;
  } catch {
    return false;
  }
}

export function MessageItem({ message, isOwn = false }: MessageItemProps) {
  const isProtocol = isProtocolMessage(message.text);

  // Protocol message
  if (isProtocol) {
    const parsedContent = JSON.parse(message.text);

    return (
      <div className="flex gap-3">
        <div
          className={`w-8 h-8 bg-gradient-to-br ${getAvatarGradient(
            message.from
          )} rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
        >
          {getInitials(message.from)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-medium text-blue-400">{message.from}</span>
            <span className="text-xs text-zinc-600">{formatTime(message.timestamp)}</span>
          </div>
          <div className="inline-block max-w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl rounded-tl-none px-4 py-2.5 font-mono text-xs">
            <div className="flex items-center gap-2 mb-1.5 text-amber-400">
              <Code className="w-3 h-3" />
              <span className="font-semibold">Protocol Message</span>
            </div>
            <pre className="text-zinc-400 overflow-x-auto">
              {JSON.stringify(parsedContent, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // Regular message
  if (isOwn) {
    return (
      <div className="flex gap-3 flex-row-reverse">
        <div
          className={`w-8 h-8 bg-gradient-to-br ${getAvatarGradient(
            message.from
          )} rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
        >
          {getInitials(message.from)}
        </div>
        <div className="flex-1 min-w-0 flex flex-col items-end">
          <div className="flex items-baseline gap-2 mb-1 flex-row-reverse">
            <span className="text-sm font-medium text-emerald-400">{message.from}</span>
            <span className="text-xs text-zinc-600">{formatTime(message.timestamp)}</span>
          </div>
          <div className="inline-block max-w-full bg-cyan-500/10 border border-cyan-500/30 rounded-2xl rounded-tr-none px-4 py-2.5">
            <p className="text-sm text-zinc-100">{message.text}</p>
          </div>
        </div>
      </div>
    );
  }

  // Received message
  return (
    <div className="flex gap-3">
      <div
        className={`w-8 h-8 bg-gradient-to-br ${getAvatarGradient(
          message.from
        )} rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
      >
        {getInitials(message.from)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-blue-400">{message.from}</span>
          <span className="text-xs text-zinc-600">{formatTime(message.timestamp)}</span>
        </div>
        <div className="inline-block max-w-full bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none px-4 py-2.5">
          <p className="text-sm text-zinc-200">{message.text}</p>
        </div>
      </div>
    </div>
  );
}
