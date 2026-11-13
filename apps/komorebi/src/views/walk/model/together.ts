import {
  MESSAGE,
  ROOM_ERROR,
  ROOM_ID_PATTERN,
  parseServerMessage,
  type Climate,
  type Peer,
  type Walker,
} from '@komorebi/realtime';

export const CONNECTION = {
  offline: 'offline',
  connecting: 'connecting',
  online: 'online',
  retrying: 'retrying',
  error: 'error',
} as const;
export type Connection = (typeof CONNECTION)[keyof typeof CONNECTION];
export type TogetherState = {
  status: Connection;
  peers: Peer[];
  climate: Climate | null;
  error: string;
};
export const EMPTY_TOGETHER: TogetherState = { status: CONNECTION.offline, peers: [], climate: null, error: '' };
const SEND_INTERVAL_MS = 120;
const CONNECT_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 800;
const ERROR_LABEL = {
  [ROOM_ERROR.full]: '이 산책에는 이미 네 명이 함께하고 있어요.',
  [ROOM_ERROR.invalid]: '접속 정보를 확인하지 못했어요. 다시 입장해 주세요.',
  [ROOM_ERROR.rate]: '연결이 잠시 쉬고 있어요. 다시 입장해 주세요.',
};

export function roomFromHash(hash: string): string | null {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get('room');
  return value && ROOM_ID_PATTERN.test(value) ? value : null;
}
export function createRoomId(): string {
  return crypto.randomUUID().replaceAll('-', '');
}
export function invitationUrl(room: string, href: string): string {
  if (!ROOM_ID_PATTERN.test(room)) throw new Error('Invalid room');
  const url = new URL(href);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Invalid invitation origin');
  url.hash = new URLSearchParams({ room }).toString();
  return url.toString();
}

type Options = {
  endpoint: string;
  room: string;
  nickname: string;
  climate: Climate;
  getWalker: () => Walker | null;
  onState: (state: TogetherState) => void;
  onPeers: (peers: Peer[]) => void;
  onArrival: (peers: Peer[]) => void;
};

export function connectTogether(options: Options): { close: () => void } {
  let socket: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let isClosed = false;
  let isTerminal = false;
  let retries = 0;
  let selfId = '';
  let climate: Climate | null = null;
  let lastSent = '';
  let lastSentAt = 0;
  let lastUiSignature = '';
  let hasArrived = false;
  let lastReceivedAt = 0;
  const update = (status: Connection, peers: Peer[] = [], error = '') => {
    const signature = JSON.stringify({
      status,
      climate,
      error,
      peers: peers.map((peer) => [peer.id, peer.nickname, peer.walker.region]),
    });
    if (signature !== lastUiSignature) {
      lastUiSignature = signature;
      options.onState({ status, peers, climate, error });
    }
    options.onPeers(peers.filter((peer) => peer.id !== selfId));
  };
  function open() {
    if (isClosed) return;
    update(retries ? CONNECTION.retrying : CONNECTION.connecting);
    const current = new WebSocket(`${options.endpoint}/rooms/${options.room}`);
    socket = current;
    timeout = setTimeout(() => current.close(), CONNECT_TIMEOUT_MS);
    current.onopen = () => {
      if (isClosed || socket !== current) return;
      const walker = options.getWalker();
      if (!walker) {
        current.close();
        return;
      }
      current.send(
        JSON.stringify({ type: MESSAGE.hello, nickname: options.nickname, walker, climate: options.climate }),
      );
    };
    current.onmessage = (event: MessageEvent<unknown>) => {
      if (isClosed || socket !== current) return;
      const message = parseServerMessage(event.data);
      lastReceivedAt = Date.now();
      if (!message) {
        isTerminal = true;
        update(CONNECTION.error, [], '산책 정보를 읽지 못했어요. 다시 입장해 주세요.');
        current.close();
        return;
      }
      if (message.type === MESSAGE.error) {
        isTerminal = true;
        update(CONNECTION.error, [], ERROR_LABEL[message.reason]);
        current.close();
        return;
      }
      if (message.type === MESSAGE.welcome) {
        clearTimeout(timeout);
        selfId = message.id;
        climate = message.climate;
        retries = 0;
        lastSent = '';
      }
      if (selfId) {
        update(CONNECTION.online, message.peers);
        if (!hasArrived && message.type === MESSAGE.welcome) {
          hasArrived = true;
          options.onArrival(message.peers.filter((peer) => peer.id !== selfId));
        }
      }
    };
    current.onclose = () => {
      if (socket !== current) return;
      clearTimeout(timeout);
      selfId = '';
      if (isClosed || isTerminal) return;
      retries += 1;
      if (retries > MAX_RETRIES) {
        update(CONNECTION.error, [], '친구와 연결하지 못했어요. 잠시 후 다시 입장해 주세요.');
        return;
      }
      update(CONNECTION.retrying);
      if (!navigator.onLine) return;
      retryTimer = setTimeout(open, Math.min(RETRY_DELAY_MS * 2 ** (retries - 1), 8_000));
    };
    current.onerror = () => current.close();
  }
  const timer = setInterval(() => {
    if (socket?.readyState !== WebSocket.OPEN || !selfId) return;
    if (Date.now() - lastReceivedAt > 15_000) {
      socket.close();
      return;
    }
    const walker = options.getWalker();
    if (!walker) return;
    const serialized = JSON.stringify({ type: MESSAGE.move, walker });
    if (serialized === lastSent && Date.now() - lastSentAt < 5_000) return;
    if (socket.bufferedAmount > 4_096) return;
    socket.send(serialized);
    lastSent = serialized;
    lastSentAt = Date.now();
  }, SEND_INTERVAL_MS);
  function reconnectOnline() {
    if (isClosed || isTerminal || socket?.readyState === WebSocket.OPEN) return;
    clearTimeout(retryTimer);
    clearTimeout(timeout);
    selfId = '';
    retries = 0;
    open();
  }
  function disconnectOffline() {
    if (isClosed || isTerminal) return;
    clearTimeout(retryTimer);
    socket?.close();
    update(CONNECTION.retrying);
  }
  window.addEventListener('online', reconnectOnline);
  window.addEventListener('offline', disconnectOffline);
  open();
  return {
    close() {
      isClosed = true;
      clearInterval(timer);
      clearTimeout(retryTimer);
      clearTimeout(timeout);
      window.removeEventListener('online', reconnectOnline);
      window.removeEventListener('offline', disconnectOffline);
      socket?.close(1000, 'Left walk');
      options.onPeers([]);
    },
  };
}
