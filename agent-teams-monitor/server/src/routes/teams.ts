import { Router } from 'express';
import { fileWatcher } from '../watcher';
import type { Team, Member, Message, Task } from '../types';

const router = Router();

/**
 * GET /api/teams
 * 获取所有团队列表
 */
router.get('/', (_req, res) => {
  const teams = fileWatcher.getAllTeams();
  const result: Team[] = teams.map((team) => ({
    name: team.name,
    description: team.description,
    createdAt: team.createdAt,
    leadAgentId: team.leadAgentId,
    memberCount: team.members.length,
  }));
  res.json(result);
});

/**
 * GET /api/teams/:name
 * 获取指定团队的详细信息
 */
router.get('/:name', (req, res) => {
  const { name } = req.params;
  const team = fileWatcher.getTeam(name);

  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }

  res.json(team);
});

/**
 * GET /api/teams/:name/members
 * 获取团队成员列表
 */
router.get('/:name/members', (req, res) => {
  const { name } = req.params;
  const team = fileWatcher.getTeam(name);

  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }

  const members: Member[] = team.members;
  res.json(members);
});

/**
 * GET /api/teams/:name/messages/:member
 * 获取指定成员的消息
 */
router.get('/:name/messages/:member', (req, res) => {
  const { name, member } = req.params;
  const team = fileWatcher.getTeam(name);

  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }

  const memberExists = team.members.some((m) => m.name === member);
  if (!memberExists) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }

  const messages: Message[] = fileWatcher.getMemberMessages(name, member);
  res.json(messages);
});

/**
 * GET /api/teams/:name/members/:member
 * 获取指定成员的详细信息
 */
router.get('/:name/members/:member', (req, res) => {
  const { name, member } = req.params;
  const team = fileWatcher.getTeam(name);

  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }

  const memberInfo = team.members.find((m) => m.name === member);
  if (!memberInfo) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }

  res.json(memberInfo);
});

/**
 * GET /api/teams/:name/tasks
 * 获取团队的所有任务
 */
router.get('/:name/tasks', (req, res) => {
  const { name } = req.params;
  const team = fileWatcher.getTeam(name);

  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }

  const tasks: Task[] = fileWatcher.getTeamTasks(name);
  res.json(tasks);
});

/**
 * GET /api/teams/:name/tasks/:id
 * 获取单个任务详情
 */
router.get('/:name/tasks/:id', (req, res) => {
  const { name, id } = req.params;
  const team = fileWatcher.getTeam(name);

  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }

  const task = fileWatcher.getTask(name, id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json(task);
});

export default router;
