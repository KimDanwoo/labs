import { DurableObject } from 'cloudflare:workers';
import {
  MESSAGE,
  ROOM_CAPACITY,
  ROOM_ERROR,
  ROOM_ID_PATTERN,
  parseClientMessage,
  parseServerMessage,
  type Climate,
  type Peer,
  type ServerMessage,
} from './protocol';

type Env = { ROOMS: DurableObjectNamespace<WalkRoom>; ALLOWED_ORIGINS: string };
type Session = { peer: Peer; climate: Climate; windowStart: number; messages: number; lastSeen: number };
const RATE_WINDOW_MS = 1_000;
const MESSAGES_PER_WINDOW = 25;
const SESSION_TIMEOUT_MS = 25_000;
const JOIN_TIMEOUT_MS = 10_000;

function readSession(socket: WebSocket): Session | null {
  const raw: unknown = socket.deserializeAttachment();
  // Attachments are stored by this worker; validate again after hibernation or a deployment.
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('peer' in raw) ||
    !('climate' in raw) ||
    !('windowStart' in raw) ||
    typeof raw.windowStart !== 'number' ||
    !('messages' in raw) ||
    typeof raw.messages !== 'number' ||
    !('lastSeen' in raw) ||
    typeof raw.lastSeen !== 'number'
  )
    return null;
  const message = parseServerMessage(
    JSON.stringify({
      type: MESSAGE.welcome,
      id: typeof raw.peer === 'object' && raw.peer !== null && 'id' in raw.peer ? raw.peer.id : null,
      peers: [raw.peer],
      climate: raw.climate,
    }),
  );
  const peer = message?.type === MESSAGE.welcome ? message.peers[0] : null;
  return peer && message?.type === MESSAGE.welcome
    ? { peer, climate: message.climate, windowStart: raw.windowStart, messages: raw.messages, lastSeen: raw.lastSeen }
    : null;
}

export class WalkRoom extends DurableObject<Env> {
  private peers(): Peer[] {
    return this.ctx.getWebSockets().flatMap((socket) => {
      const session = readSession(socket);
      return session ? [session.peer] : [];
    });
  }
  private send(socket: WebSocket, message: ServerMessage): void {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      socket.close(1011, 'Connection unavailable');
    }
  }
  private broadcast(): void {
    const message: ServerMessage = { type: MESSAGE.peers, peers: this.peers() };
    this.ctx.getWebSockets().forEach((socket) => this.send(socket, message));
  }
  async fetch(): Promise<Response> {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ joinedAt: Date.now() });
    if (this.ctx.getWebSockets().length > ROOM_CAPACITY) {
      this.send(server, { type: MESSAGE.error, reason: ROOM_ERROR.full });
      server.close(1008, 'Room full');
    }
    if ((await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(Date.now() + JOIN_TIMEOUT_MS);
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(socket: WebSocket, raw: string | ArrayBuffer): void {
    const message = parseClientMessage(raw);
    if (!message) {
      this.send(socket, { type: MESSAGE.error, reason: ROOM_ERROR.invalid });
      socket.close(1008, 'Invalid message');
      return;
    }
    let session = readSession(socket);
    const now = Date.now();
    if (!session) {
      if (message.type !== MESSAGE.hello) {
        socket.close(1008, 'Join first');
        return;
      }
      const existing = this.ctx
        .getWebSockets()
        .map(readSession)
        .find((entry) => entry !== null);
      session = {
        peer: { id: crypto.randomUUID(), nickname: message.nickname, walker: message.walker },
        climate: existing?.climate ?? message.climate,
        windowStart: now,
        messages: 0,
        lastSeen: now,
      };
    } else if (message.type === MESSAGE.hello) {
      socket.close(1008, 'Already joined');
      return;
    }
    if (now - session.windowStart >= RATE_WINDOW_MS) {
      session.windowStart = now;
      session.messages = 0;
    }
    session.messages += 1;
    if (session.messages > MESSAGES_PER_WINDOW) {
      this.send(socket, { type: MESSAGE.error, reason: ROOM_ERROR.rate });
      socket.close(1008, 'Too many messages');
      return;
    }
    session.peer.walker = message.walker;
    session.lastSeen = now;
    socket.serializeAttachment(session);
    if (message.type === MESSAGE.hello)
      this.send(socket, { type: MESSAGE.welcome, id: session.peer.id, peers: this.peers(), climate: session.climate });
    this.broadcast();
  }
  webSocketClose(socket: WebSocket): void {
    socket.serializeAttachment(null);
    this.broadcast();
  }
  webSocketError(socket: WebSocket): void {
    socket.serializeAttachment(null);
    socket.close(1011, 'Connection unavailable');
    this.broadcast();
  }
  async alarm(): Promise<void> {
    const now = Date.now();
    for (const socket of this.ctx.getWebSockets()) {
      const session = readSession(socket);
      const raw: unknown = socket.deserializeAttachment();
      const joinedAt =
        typeof raw === 'object' && raw !== null && 'joinedAt' in raw && typeof raw.joinedAt === 'number'
          ? raw.joinedAt
          : 0;
      const isExpired = session ? now - session.lastSeen > SESSION_TIMEOUT_MS : now - joinedAt >= JOIN_TIMEOUT_MS;
      if (isExpired) {
        socket.serializeAttachment(null);
        socket.close(1001, 'Session expired');
      }
    }
    this.broadcast();
    if (this.ctx.getWebSockets().some((socket) => socket.readyState === WebSocket.OPEN))
      await this.ctx.storage.setAlarm(now + JOIN_TIMEOUT_MS);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') return new Response('ok');
    const room = url.pathname.match(/^\/rooms\/([a-f0-9]{32})$/)?.[1];
    if (!room || !ROOM_ID_PATTERN.test(room)) return new Response('Not found', { status: 404 });
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket')
      return new Response('WebSocket required', { status: 426 });
    const origin = request.headers.get('Origin');
    const allowed = env.ALLOWED_ORIGINS.split(',').map((entry) => entry.trim());
    if (!origin || !allowed.includes(origin)) return new Response('Origin not allowed', { status: 403 });
    return env.ROOMS.getByName(room).fetch(request);
  },
} satisfies ExportedHandler<Env>;
