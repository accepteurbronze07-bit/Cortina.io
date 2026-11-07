import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '../components/toast/ToastContext';
import { soundFx } from '../utils/audioUtils';

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  joinedAt?: number;
}

export interface CollabRoomState {
  roomId: string;
  topic: string;
  fullScript: string;
  hookText: string;
  narrativeStyle: string;
  hashtags: string[];
  lastModified: number;
  lastEditorName: string;
}

interface UseScriptCollaborationOptions {
  onRemoteScriptUpdate?: (state: CollabRoomState, editor: CollabUser) => void;
  onUserJoined?: (user: CollabUser) => void;
  onUserLeft?: (user: CollabUser) => void;
}

const COLLAB_COLORS = [
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
];

function getStoredUser(): CollabUser {
  try {
    const raw = localStorage.getItem('cortia_collab_user');
    if (raw) return JSON.parse(raw);
  } catch {}

  const randomColor = COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)];
  const randomNum = Math.floor(100 + Math.random() * 899);
  const newUser: CollabUser = {
    id: `user_${Date.now()}_${randomNum}`,
    name: `Créateur #${randomNum}`,
    color: randomColor,
  };
  try {
    localStorage.setItem('cortia_collab_user', JSON.stringify(newUser));
  } catch {}
  return newUser;
}

export function useScriptCollaboration(options: UseScriptCollaborationOptions = {}) {
  const [currentUser, setCurrentUser] = useState<CollabUser>(getStoredUser);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [activeUsers, setActiveUsers] = useState<CollabUser[]>([]);
  const [lastEditor, setLastEditor] = useState<{ name: string; color: string; time: number } | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // id -> name

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRemoteUpdatingRef = useRef<boolean>(false);
  const currentRoomIdRef = useRef<string | null>(null);

  // Keep ref up to date
  currentRoomIdRef.current = activeRoomId;

  const updateMyName = (name: string) => {
    const clean = name.trim() || `Créateur #${Math.floor(100 + Math.random() * 899)}`;
    const updated = { ...currentUser, name: clean };
    setCurrentUser(updated);
    try {
      localStorage.setItem('cortia_collab_user', JSON.stringify(updated));
    } catch {}

    // Notify room if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeRoomId) {
      wsRef.current.send(
        JSON.stringify({
          type: 'join:room',
          roomId: activeRoomId,
          user: updated,
        })
      );
    }
  };

  // Connect to WebSocket
  const connectWs = useCallback((roomId: string, initialData?: Partial<CollabRoomState>) => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
    }

    setIsConnecting(true);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/collab`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      console.log(`[Collab Client] Connected to WS for room: ${roomId}`);

      // Send join event
      ws.send(
        JSON.stringify({
          type: 'join:room',
          roomId,
          user: currentUser,
          initialScript: initialData,
        })
      );

      // Heartbeat ping every 20s
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 20000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { type } = msg;

        if (type === 'room:init') {
          setActiveUsers(msg.activeUsers || []);
          if (msg.state && options.onRemoteScriptUpdate) {
            isRemoteUpdatingRef.current = true;
            options.onRemoteScriptUpdate(msg.state, msg.state.lastEditorName);
            setTimeout(() => {
              isRemoteUpdatingRef.current = false;
            }, 50);
          }
        } else if (type === 'script:updated') {
          if (msg.state) {
            isRemoteUpdatingRef.current = true;
            setLastEditor({
              name: msg.editor?.name || msg.state.lastEditorName || 'Un collaborateur',
              color: msg.editor?.color || '#10b981',
              time: Date.now(),
            });

            if (options.onRemoteScriptUpdate) {
              options.onRemoteScriptUpdate(msg.state, msg.editor);
            }

            setTimeout(() => {
              isRemoteUpdatingRef.current = false;
            }, 50);
          }
        } else if (type === 'user:joined') {
          setActiveUsers(msg.activeUsers || []);
          if (msg.user && msg.user.id !== currentUser.id) {
            soundFx.playSfx('ding');
            toast.info(`${msg.user.name} a rejoint la session collaborative en direct.`, 'Nouveau Collaborateur');
            if (options.onUserJoined) options.onUserJoined(msg.user);
          }
        } else if (type === 'user:left') {
          setActiveUsers(msg.activeUsers || []);
          if (msg.user && msg.user.id !== currentUser.id) {
            if (options.onUserLeft) options.onUserLeft(msg.user);
          }
        } else if (type === 'cursor:presence') {
          if (msg.user && msg.user.id !== currentUser.id) {
            setTypingUsers((prev) => {
              const copy = new Map(prev);
              if (msg.isTyping) {
                copy.set(msg.user.id, msg.user.name);
              } else {
                copy.delete(msg.user.id);
              }
              return copy;
            });
          }
        }
      } catch (err) {
        console.error('[Collab Client] Message parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.warn('[Collab Client] WS connection error:', err);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      // Auto-reconnect if we still have an active room
      if (currentRoomIdRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (currentRoomIdRef.current) {
            console.log(`[Collab Client] Attempting auto-reconnect to room: ${currentRoomIdRef.current}`);
            connectWs(currentRoomIdRef.current);
          }
        }, 3000);
      }
    };
  }, [currentUser, options]);

  // Join or Start a Room
  const startOrJoinRoom = useCallback(async (
    roomIdToJoin?: string,
    initialData?: {
      fullScript?: string;
      topic?: string;
      hookText?: string;
      narrativeStyle?: string;
      hashtags?: string[];
    }
  ): Promise<string> => {
    const finalRoomId = (
      roomIdToJoin || `collab-${Math.random().toString(36).substring(2, 8)}`
    ).replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();

    setActiveRoomId(finalRoomId);
    currentRoomIdRef.current = finalRoomId;

    // First, register session on server via REST to ensure state is initialized
    try {
      await fetch('/api/collab/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: finalRoomId,
          topic: initialData?.topic,
          fullScript: initialData?.fullScript,
          hookText: initialData?.hookText,
          narrativeStyle: initialData?.narrativeStyle,
          hashtags: initialData?.hashtags,
          creatorName: currentUser.name,
        }),
      });
    } catch (e) {
      console.warn('REST init warning (will continue with WS):', e);
    }

    // Connect WebSocket
    connectWs(finalRoomId, initialData);

    return finalRoomId;
  }, [connectWs, currentUser.name]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    currentRoomIdRef.current = null;
    setActiveRoomId(null);
    setIsConnected(false);
    setActiveUsers([]);
    setLastEditor(null);
    setTypingUsers(new Map());

    // Clean URL query param without full reload
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('collab');
      url.searchParams.delete('session');
      window.history.replaceState({}, '', url.toString());
    } catch {}

    toast.info('Session collaborative quittée.', 'Collaboration');
  }, []);

  // Broadcast local changes (debounced by caller if necessary)
  const broadcastScriptChange = useCallback((delta: {
    fullScript?: string;
    topic?: string;
    hookText?: string;
    narrativeStyle?: string;
    hashtags?: string[];
  }) => {
    // If this update was triggered by an incoming remote event, skip broadcast to prevent echo loops
    if (isRemoteUpdatingRef.current) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !activeRoomId) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'script:update',
        roomId: activeRoomId,
        editorName: currentUser.name,
        ...delta,
      })
    );
  }, [activeRoomId, currentUser.name]);

  // Broadcast typing presence
  const sendTypingPresence = useCallback((isTyping: boolean, cursorLine?: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !activeRoomId) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'cursor:presence',
        roomId: activeRoomId,
        isTyping,
        cursorLine,
      })
    );
  }, [activeRoomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
      }
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // Generate share link
  const getShareLink = useCallback(() => {
    if (!activeRoomId) return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?collab=${activeRoomId}`;
  }, [activeRoomId]);

  return {
    currentUser,
    updateMyName,
    activeRoomId,
    isConnected,
    isConnecting,
    activeUsers,
    lastEditor,
    typingUsers: Array.from(typingUsers.values()),
    startOrJoinRoom,
    leaveRoom,
    broadcastScriptChange,
    sendTypingPresence,
    getShareLink,
    isRemoteUpdating: isRemoteUpdatingRef.current,
  };
}
