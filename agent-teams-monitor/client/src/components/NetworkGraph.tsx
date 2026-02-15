import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { Member, Message } from '../types';

interface NetworkNode {
  id: string;
  name: string;
  x: number;
  y: number;
  isLead: boolean;
  color: string;
  avatar: string;
}

interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  animated: boolean;
  messageType?: 'normal' | 'protocol' | 'system';
}

interface EdgeWithCoords extends NetworkEdge {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  controlX: number;
  controlY: number;
}

interface Particle {
  id: string;
  edge: EdgeWithCoords;
  color: string;
}

interface NetworkGraphProps {
  members: Member[];
  leadAgentId?: string;
  messages: Message[];
  allTeamMessages?: Map<string, Message[]>; // key: memberName, value: messages
  teamName: string | null;
  selectedMemberName?: string | null;
  onNodeClick: (memberName: string) => void;
}

// 粒子动画组件
function FlowingParticle({ edge, color }: { edge: EdgeWithCoords; color: string }) {
  const pathId = `path-${edge.id}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <>
      {/* 隐藏的路径定义 */}
      <defs>
        <path
          id={pathId}
          d={`M ${edge.fromX} ${edge.fromY} Q ${edge.controlX} ${edge.controlY} ${edge.toX} ${edge.toY}`}
        />
      </defs>
      {/* 流动的粒子 */}
      <circle r="4" fill={color} filter="url(#glow)">
        <animateMotion dur="0.8s" repeatCount="1" path={`url(#${pathId})`} />
      </circle>
    </>
  );
}

export function NetworkGraph({
  members,
  leadAgentId,
  messages,
  allTeamMessages,
  teamName,
  selectedMemberName,
  onNodeClick,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 280 });
  const [activeParticles, setActiveParticles] = useState<Particle[]>([]);

  // 监听容器尺寸变化
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    // 使用 ResizeObserver 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(containerRef.current);

    // 延迟检测确保 DOM 完全渲染
    const rafId = requestAnimationFrame(() => {
      updateDimensions();
    });

    // 额外延迟确保布局稳定
    const timeoutId = setTimeout(() => {
      updateDimensions();
    }, 100);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [members]);

  // 计算节点位置（分层布局）
  const nodes = useMemo<NetworkNode[]>(() => {
    if (!members.length) return [];

    const { width, height } = dimensions;
    const padding = 80;
    const availableWidth = width - padding * 2;
    const leadY = height * 0.25;
    const membersY = height * 0.75;

    const lead = members.find((m) => m.agentId === leadAgentId);
    const regularMembers = members.filter((m) => m.agentId !== leadAgentId);

    const result: NetworkNode[] = [];

    // Lead 节点在顶部中央
    if (lead) {
      result.push({
        id: lead.name,
        name: lead.name,
        x: width / 2,
        y: leadY,
        isLead: true,
        color: lead.color || '#10b981',
        avatar: lead.name.slice(0, 2).toUpperCase(),
      });
    }

    // Members 在底部水平均匀分布
    const memberCount = regularMembers.length;
    const spacing = memberCount > 1 ? availableWidth / (memberCount - 1) : 0;
    const startX = memberCount > 1 ? padding : width / 2;

    regularMembers.forEach((member, index) => {
      result.push({
        id: member.name,
        name: member.name,
        x: memberCount > 1 ? startX + spacing * index : width / 2,
        y: membersY,
        isLead: false,
        color: member.color || '#3b82f6',
        avatar: member.name.slice(0, 2).toUpperCase(),
      });
    });

    return result;
  }, [members, leadAgentId, dimensions]);

  // 计算边（基于所有团队成员的消息历史创建所有必要的连接）
  const edges = useMemo<NetworkEdge[]>(() => {
    if (!nodes.length) return [];

    const edgeMap = new Map<string, NetworkEdge>();

    // 辅助函数：创建边的唯一 ID（无方向）
    const getEdgeId = (from: string, to: string) => {
      // 对节点名排序，确保边 ID 一致（A-B 和 B-A 是同一条边）
      const sorted = [from, to].sort();
      return `${sorted[0]}-${sorted[1]}`;
    };

    // 1. 从所有团队成员的消息中提取通信关系
    // 使用 allTeamMessages（所有成员的消息）而不是 messages（当前选中成员的消息）
    const allMessages = allTeamMessages || new Map<string, Message[]>();

    allMessages.forEach((memberMessages, receiverName) => {
      memberMessages.forEach((msg) => {
        const sender = msg.from;
        // 只创建实际存在的通信关系（sender -> receiver）
        if (sender !== receiverName) {
          const edgeId = getEdgeId(sender, receiverName);
          if (!edgeMap.has(edgeId)) {
            edgeMap.set(edgeId, {
              id: edgeId,
              from: sender,
              to: receiverName,
              animated: false,
            });
          }
        }
      });
    });

    // 2. 如果没有足够的边，至少创建 Lead 与每个 Member 的连接
    if (edgeMap.size < nodes.length - 1) {
      const lead = nodes.find((n) => n.isLead);
      if (lead) {
        nodes
          .filter((n) => !n.isLead)
          .forEach((member) => {
            const edgeId = getEdgeId(lead.id, member.id);
            if (!edgeMap.has(edgeId)) {
              edgeMap.set(edgeId, {
                id: edgeId,
                from: lead.id,
                to: member.id,
                animated: false,
              });
            }
          });
      }
    }

    return Array.from(edgeMap.values());
  }, [nodes, allTeamMessages]);

  // 获取边的坐标
  const getEdgeCoordinates = useCallback(
    (edge: NetworkEdge) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) return null;

      // 控制点用于贝塞尔曲线（创建弧线效果）
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      // 根据 x 距离调整控制点，创建自然弧线
      const curveIntensity = Math.abs(toNode.x - fromNode.x) * 0.1;

      return {
        fromX: fromNode.x,
        fromY: fromNode.y + 24, // 从节点底部出发
        toX: toNode.x,
        toY: toNode.y - 24, // 连接到节点顶部
        controlX: midX,
        controlY: midY - curveIntensity - 30,
      };
    },
    [nodes]
  );

  // 节点悬停状态管理
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 监听消息变化，触发粒子动画
  useEffect(() => {
    if (!messages.length || !edges.length) return;

    const latestMessage = messages[messages.length - 1];
    const sender = latestMessage.from;
    const receiver = selectedMemberName;

    // 找到从 sender 到 receiver 的特定边
    const targetEdge = edges.find((e) => {
      return (e.from === sender && e.to === receiver) || (e.from === receiver && e.to === sender);
    });

    if (targetEdge) {
      const coords = getEdgeCoordinates(targetEdge);
      if (coords) {
        // 根据消息类型确定颜色
        let color = '#06b6d4'; // 默认 cyan
        if (latestMessage.text.includes('"type"')) {
          color = '#f59e0b'; // protocol - amber
        } else if (latestMessage.text.includes('entered idle') || latestMessage.text.includes('system')) {
          color = '#10b981'; // system - emerald
        }

        const particle: Particle = {
          id: `${targetEdge.id}-${Date.now()}-${Math.random()}`,
          edge: { ...targetEdge, ...coords },
          color,
        };

        setActiveParticles((prev) => [...prev, particle]);

        // 动画结束后清理
        setTimeout(() => {
          setActiveParticles((prev) => prev.filter((p) => p.id !== particle.id));
        }, 1000);
      }
    }
  }, [messages, edges, getEdgeCoordinates, selectedMemberName]);

  if (!nodes.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
        {teamName ? 'No members in this team' : 'Select a team to view network'}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg width={dimensions.width} height={dimensions.height} className="absolute inset-0">
        {/* 滤镜定义 */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3f3f46" />
            <stop offset="100%" stopColor="#52525b" />
          </linearGradient>
        </defs>

        {/* 连线 */}
        {edges.map((edge) => {
          const fromNode = nodes.find((n) => n.id === edge.from);
          const toNode = nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const fromX = fromNode.x;
          const fromY = fromNode.y + 24; // 从节点底部出发
          const toX = toNode.x;
          const toY = toNode.y - 24; // 连接到节点顶部
          const midX = (fromX + toX) / 2;
          const midY = (fromY + toY) / 2;
          const curveIntensity = Math.abs(toX - fromX) * 0.1;

          return (
            <path
              key={edge.id}
              d={`M ${fromX} ${fromY} Q ${midX} ${midY - curveIntensity - 30} ${toX} ${toY}`}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              className="transition-all duration-300"
            />
          );
        })}

        {/* 粒子动画层 */}
        {activeParticles.map((particle) => (
          <FlowingParticle
            key={particle.id}
            edge={particle.edge}
            color={particle.color}
          />
        ))}

        {/* 节点 */}
        {nodes.map((node) => {
          const isHovered = hoveredNode === node.id;
          // SVG transform: translate to origin, scale, translate back
          const transform = isHovered
            ? `translate(${node.x}, ${node.y}) scale(1.15) translate(${-node.x}, ${-node.y})`
            : undefined;

          return (
            <g
              key={node.id}
              className="cursor-pointer transition-all duration-200"
              transform={transform}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onNodeClick(node.name)}
            >
            {/* 节点外圈 glow（仅 Lead） */}
            {node.isLead && (
              <circle
                cx={node.x}
                cy={node.y}
                r="32"
                fill="none"
                stroke={node.color}
                strokeWidth="2"
                opacity="0.3"
                className="animate-pulse"
              />
            )}

            {/* 节点背景 */}
            <circle
              cx={node.x}
              cy={node.y}
              r="28"
              fill="#18181b"
              stroke={node.color}
              strokeWidth="2"
              className="transition-all duration-200"
            />

            {/* 节点内部渐变背景 */}
            <defs>
              <radialGradient id={`grad-${node.id}`} cx="30%" cy="30%">
                <stop offset="0%" stopColor={node.color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={node.color} stopOpacity="0.3" />
              </radialGradient>
            </defs>
            <circle
              cx={node.x}
              cy={node.y}
              r="24"
              fill={`url(#grad-${node.id})`}
            />

            {/* 头像文字 */}
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="12"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >
              {node.avatar}
            </text>

            {/* 节点标签 */}
            <text
              x={node.x}
              y={node.y + 45}
              textAnchor="middle"
              fill="#a1a1aa"
              fontSize="11"
              fontWeight="500"
              style={{ pointerEvents: 'none' }}
            >
              {node.name}
            </text>

            {/* Lead 标识 */}
            {node.isLead && (
              <g transform={`translate(${node.x + 18}, ${node.y - 18})`}>
                <polygon
                  points="0,-8 6,8 -6,8"
                  fill="#f59e0b"
                  stroke="#18181b"
                  strokeWidth="1"
                />
              </g>
            )}
          </g>
        )})}
      </svg>

      {/* 图例 */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-500" />
          <span>Message</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Protocol</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>System</span>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="absolute top-3 right-3 text-xs text-zinc-500">
        <span className="text-zinc-400">{nodes.length}</span> nodes ·{' '}
        <span className="text-zinc-400">{edges.length}</span> connections
      </div>
    </div>
  );
}
