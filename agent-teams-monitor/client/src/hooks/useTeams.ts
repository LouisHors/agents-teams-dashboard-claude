import { useEffect, useState, useCallback } from 'react';
import type { Member, Message, Team, TeamConfig } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/teams`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTeams(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch teams';
      setError(message);
      console.error('Error fetching teams:', err);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return { teams, loading, error, refetch: fetchTeams };
}

export function useTeamConfig(teamName: string | null) {
  const [config, setConfig] = useState<TeamConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamName) {
      setConfig(null);
      return;
    }

    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/teams/${teamName}`);
        if (!response.ok) throw new Error('Failed to fetch team config');
        const data = await response.json();
        setConfig(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [teamName]);

  return { config, loading, error };
}

export function useTeamMembers(teamName: string | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamName) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/teams/${teamName}/members`);
        if (!response.ok) throw new Error('Failed to fetch members');
        const data = await response.json();
        setMembers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [teamName]);

  return { members, loading, error };
}

export function useMemberMessages(teamName: string | null, memberName: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!teamName || !memberName) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/teams/${teamName}/messages/${memberName}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [teamName, memberName]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  return { messages, loading, error, refetch: fetchMessages, addMessage };
}

// 获取团队所有成员的消息（用于网络图）
export function useAllTeamMessages(teamName: string | null, members: Member[]) {
  const [allMessages, setAllMessages] = useState<Map<string, Message[]>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teamName || members.length === 0) {
      setAllMessages(new Map());
      return;
    }

    const fetchAllMessages = async () => {
      setLoading(true);
      const messagesMap = new Map<string, Message[]>();

      await Promise.all(
        members.map(async (member) => {
          try {
            const response = await fetch(`${API_URL}/teams/${teamName}/messages/${member.name}`);
            if (response.ok) {
              const data = await response.json();
              messagesMap.set(member.name, data);
            }
          } catch (err) {
            console.error(`Failed to fetch messages for ${member.name}:`, err);
          }
        })
      );

      setAllMessages(messagesMap);
      setLoading(false);
    };

    fetchAllMessages();
  }, [teamName, members]);

  return { allMessages, loading };
}
