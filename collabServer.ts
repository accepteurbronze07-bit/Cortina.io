import type { Server as HttpServer } from 'http';
import type { Express, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
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
  createdAt: number;
}

interface ConnectedClient {
  ws: WebSocket;
  user: CollabUser;
  roomId: string;
}

interface RoomRecord {
  state: CollabRoomState;
  clients: Map<string, ConnectedClient>; // clientId -> ConnectedClient
}

const COLLAB_DATA_DIR = path.resolve(process.cwd(), 'data');
const COLLAB_FILE = path.resolve(COLLAB_DATA_DIR, 'collab_sessions.json');

// In-memory rooms map
const rooms = new Map<string, RoomRecord>();

// Pre-defined vibrant colors for collaborator badges
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

export function getRandomColor(): string {
  return COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)];
}

function loadPersistedRooms(): void {
  try {
    if (!fs.existsSync(COLLAB_DATA_DIR)) {
      fs.mkdirSync(COLLAB_DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(COLLAB_FILE)) {
      const raw = fs.readFileSync(COLLAB_FILE, 'utf-8');
      const data: Record<string, CollabRoomState> = JSON.parse(raw);
      for (const [roomId, state] of Object.entries(data)) {
        rooms.set(roomId, {
          state,
          clients: new Map(),
        });
      }
      console.log(`[Collab] Loaded ${rooms.size} persisted collaborative room(s)`);
    }
  } catch (err) {
    console.error('[Collab] Failed to load persisted rooms:', err);
  }
}

let saveTimeout: NodeJS.Timeout | null = null;
function persistRoomsDebounced(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      if (!fs.existsSync(COLLAB_DATA_DIR)) {
        fs.mkdirSync(COLLAB_DATA_DIR, { recursive: true });
      }
      const serializable: Record<string, CollabRoomState> = {};
      for (const [id, record] of rooms.entries()) {
        serializable[id] = record.state;
      }
      fs.writeFileSync(COLLAB_FILE, JSON.stringify(serializable, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Collab] Error persisting rooms to disk:', err);
    }
  }, 500);
}

function getOrCreateRoom(roomId: string, initialData?: Partial<CollabRoomState>): RoomRecord {
  let record = rooms.get(roomId);
  const now = Date.now();
  if (!record) {
    const state: CollabRoomState = {
      roomId,
      topic: initialData?.topic || 'Script Collaboratif Cortia',
      fullScript: initialData?.fullScript || '',
      hookText: initialData?.hookText || '',
      narrativeStyle: initialData?.narrativeStyle || 'mystery_bottom',
      hashtags: initialData?.hashtags || ['#viral', '#tiktok', '#creation'],
      lastModified: now,
      lastEditorName: initialData?.lastEditorName || 'Créateur',
      createdAt: now,
    };
    record = {
      state,
      clients: new Map(),
    };
    rooms.set(roomId, record);
    persistRoomsDebounced();
  } else if (initialData) {
    if (initialData.fullScript !== undefined && !record.state.fullScript) {
      record.state.fullScript = initialData.fullScript;
    }
    if (initialData.topic !== undefined && record.state.topic === 'Script Collaboratif Cortia') {
      record.state.topic = initialData.topic;
    }
    if (initialData.hookText !== undefined && !record.state.hookText) {
      record.state.hookText = initialData.hookText;
    }
  }
  return record;
}

export function registerCollabRoutes(app: Express): void {
  loadPersistedRooms();

  // 1. REST Endpoints for Session Management
  // POST /api/collab/session — Create or register a shared session
  app.post('/api/collab/session', (req: Request, res: Response) => {
    try {
      const {
        roomId,
        topic,
        fullScript,
        hookText,
        narrativeStyle,
        hashtags,
        creatorName,
      } = req.body || {};

      const cleanRoomId = (
        roomId || `cortia-${crypto.randomBytes(4).toString('hex')}`
      ).replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();

      const record = getOrCreateRoom(cleanRoomId, {
        topic: topic || 'Script Collaboratif',
        fullScript: fullScript || '',
        hookText: hookText || '',
        narrativeStyle: narrativeStyle || 'mystery_bottom',
        hashtags: Array.isArray(hashtags) ? hashtags : ['#viral', '#tiktok'],
        lastEditorName: creatorName || 'Créateur Cortia',
      });

      // Update room state if new script provided
      if (fullScript !== undefined && fullScript !== record.state.fullScript) {
        record.state.fullScript = fullScript;
        record.state.lastModified = Date.now();
        if (topic) record.state.topic = topic;
        if (hookText) record.state.hookText = hookText;
        if (narrativeStyle) record.state.narrativeStyle = narrativeStyle;
        if (hashtags) record.state.hashtags = hashtags;
        if (creatorName) record.state.lastEditorName = creatorName;
        persistRoomsDebounced();
      }

      const activeUsers: CollabUser[] = Array.from(record.clients.values()).map((c) => c.user);

      return res.json({
        success: true,
        roomId: cleanRoomId,
        state: record.state,
        activeUsers,
        activeUserCount: activeUsers.length,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Error managing collab room' });
    }
  });

  // GET /api/collab/session/:roomId — Get room state
  app.get('/api/collab/session/:roomId', (req: Request, res: Response) => {
    const { roomId } = req.params;
    const cleanRoomId = String(roomId || '').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    const record = rooms.get(cleanRoomId);

    if (!record) {
      return res.status(404).json({ success: false, error: 'Session collaborative introuvable' });
    }

    const activeUsers: CollabUser[] = Array.from(record.clients.values()).map((c) => c.user);
    return res.json({
      success: true,
      state: record.state,
      activeUsers,
      activeUserCount: activeUsers.length,
    });
  });

  // GET /api/collab/sessions — List recent sessions
  app.get('/api/collab/sessions', (_req: Request, res: Response) => {
    const list = Array.from(rooms.values())
      .map((r) => ({
        ...r.state,
        activeUserCount: r.clients.size,
      }))
      .sort((a, b) => b.lastModified - a.lastModified)
      .slice(0, 10);

    return res.json({ success: true, sessions: list });
  });
}

export function attachCollabWebSocket(httpServer: HttpServer): void {
  // 2. WebSocket Server on dedicated /ws/collab path
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws/collab',
  });

  console.log('[Collab] WebSocket server initialized on path: /ws/collab');

  wss.on('connection', (ws: WebSocket, req) => {
    let currentRoomId: string | null = null;
    let currentUser: CollabUser | null = null;
    const clientId = `client_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    const broadcastToRoom = (roomId: string, message: any, excludeWs?: WebSocket) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const payload = JSON.stringify(message);
      for (const client of room.clients.values()) {
        if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
          try {
            client.ws.send(payload);
          } catch {
            // ignore send error
          }
        }
      }
    };

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const { type } = msg;

        // A. JOIN ROOM
        if (type === 'join:room') {
          const { roomId, user, initialScript } = msg;
          const cleanRoomId = String(roomId || 'main').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();

          // Leave existing room if any
          if (currentRoomId && currentRoomId !== cleanRoomId) {
            const oldRoom = rooms.get(currentRoomId);
            if (oldRoom) {
              oldRoom.clients.delete(clientId);
              const remainingUsers = Array.from(oldRoom.clients.values()).map((c) => c.user);
              broadcastToRoom(currentRoomId, {
                type: 'user:left',
                user: currentUser,
                activeUsers: remainingUsers,
              });
            }
          }

          currentRoomId = cleanRoomId;
          const assignedUser: CollabUser = {
            id: user?.id || clientId,
            name: user?.name || `Créateur ${Math.floor(10 + Math.random() * 89)}`,
            color: user?.color || getRandomColor(),
            joinedAt: Date.now(),
          };
          currentUser = assignedUser;

          const room = getOrCreateRoom(cleanRoomId, initialScript);
          room.clients.set(clientId, {
            ws,
            user: assignedUser,
            roomId: cleanRoomId,
          });

          const activeUsers = Array.from(room.clients.values()).map((c) => c.user);

          // 1. Send initial state to the newly joined client
          ws.send(
            JSON.stringify({
              type: 'room:init',
              state: room.state,
              activeUsers,
              user: assignedUser,
            })
          );

          // 2. Broadcast join event to all other clients in this room
          broadcastToRoom(
            cleanRoomId,
            {
              type: 'user:joined',
              user: assignedUser,
              activeUsers,
            },
            ws
          );

          return;
        }

        // B. SCRIPT / TOPIC / STYLE UPDATE
        if (type === 'script:update') {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const { fullScript, topic, hookText, narrativeStyle, hashtags, editorName } = msg;
          let changed = false;

          if (fullScript !== undefined && fullScript !== room.state.fullScript) {
            room.state.fullScript = fullScript;
            changed = true;
          }
          if (topic !== undefined && topic !== room.state.topic) {
            room.state.topic = topic;
            changed = true;
          }
          if (hookText !== undefined && hookText !== room.state.hookText) {
            room.state.hookText = hookText;
            changed = true;
          }
          if (narrativeStyle !== undefined && narrativeStyle !== room.state.narrativeStyle) {
            room.state.narrativeStyle = narrativeStyle;
            changed = true;
          }
          if (hashtags !== undefined) {
            room.state.hashtags = hashtags;
            changed = true;
          }

          if (changed) {
            room.state.lastModified = Date.now();
            room.state.lastEditorName = editorName || currentUser?.name || 'Un collaborateur';
            persistRoomsDebounced();

            // Broadcast real-time update to all OTHER clients in the room
            broadcastToRoom(
              currentRoomId,
              {
                type: 'script:updated',
                state: room.state,
                editor: currentUser,
              },
              ws
            );
          }

          return;
        }

        // C. CURSOR / TYPING PRESENCE
        if (type === 'cursor:presence') {
          if (!currentRoomId || !currentUser) return;
          const { isTyping, cursorLine } = msg;

          broadcastToRoom(
            currentRoomId,
            {
              type: 'cursor:presence',
              user: currentUser,
              isTyping: Boolean(isTyping),
              cursorLine: typeof cursorLine === 'number' ? cursorLine : undefined,
            },
            ws
          );
          return;
        }

        // D. HEARTBEAT / PING
        if (type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (err) {
        console.error('[Collab] WS message parse error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.clients.delete(clientId);
          const activeUsers = Array.from(room.clients.values()).map((c) => c.user);
          broadcastToRoom(currentRoomId, {
            type: 'user:left',
            user: currentUser,
            activeUsers,
          });
        }
      }
    });

    ws.on('error', (err) => {
      console.warn('[Collab] Client WS error:', err?.message || err);
    });
  });
}
