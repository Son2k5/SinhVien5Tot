export const SESSION_EXPIRED_EVENT = 'sv5t:session-expired';
export type SessionEndReason = 'inactive' | 'expired' | 'logout';

const LAST_ACTIVITY_KEY = 'sv5t:session:last-activity';
const SESSION_END_KEY = 'sv5t:session:end';
const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const ACTIVITY_PERSIST_INTERVAL_MS = 15 * 1000;
const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
] as const;

function readTimestamp(key: string): number | null {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeTimestamp(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // The in-memory timer remains authoritative when storage is unavailable.
  }
}

export function markSessionActivity(): void {
  try { window.localStorage.removeItem(SESSION_END_KEY); } catch { /* noop */ }
  writeTimestamp(LAST_ACTIVITY_KEY, Date.now());
}

export function clearSessionActivity(reason: SessionEndReason = 'expired'): void {
  try {
    window.localStorage.setItem(SESSION_END_KEY, `${Date.now()}:${reason}`);
    window.localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // Storage can be unavailable in hardened browser modes.
  }
}

export function startSessionInactivityMonitor(
  onTimeout: (reason: SessionEndReason) => void,
): () => void {
  let stopped = false;
  let timeoutTriggered = false;
  let timeoutId: number | undefined;
  let lastActivity = readTimestamp(LAST_ACTIVITY_KEY) ?? Date.now();
  let lastPersistedActivity = lastActivity;

  const expire = (reason: SessionEndReason = 'inactive') => {
    if (stopped || timeoutTriggered) return;
    timeoutTriggered = true;
    onTimeout(reason);
  };

  const scheduleTimeout = () => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    const remaining = IDLE_TIMEOUT_MS - (Date.now() - lastActivity);
    if (remaining <= 0) {
      expire();
      return;
    }
    timeoutId = window.setTimeout(() => expire('inactive'), remaining);
  };

  const recordActivity: EventListener = () => {
    if (stopped || timeoutTriggered) return;
    const now = Date.now();
    lastActivity = now;
    if (now - lastPersistedActivity >= ACTIVITY_PERSIST_INTERVAL_MS) {
      writeTimestamp(LAST_ACTIVITY_KEY, now);
      lastPersistedActivity = now;
    }
    scheduleTimeout();
  };

  const syncActivity = (event: StorageEvent) => {
    if (event.key === SESSION_END_KEY && event.newValue) {
      const reason = event.newValue.endsWith(':inactive')
        ? 'inactive'
        : event.newValue.endsWith(':logout')
          ? 'logout'
          : 'expired';
      expire(reason);
      return;
    }
    if (event.key !== LAST_ACTIVITY_KEY || event.newValue === null) return;
    const timestamp = Number(event.newValue);
    if (Number.isFinite(timestamp) && timestamp > lastActivity) {
      lastActivity = timestamp;
      lastPersistedActivity = timestamp;
      scheduleTimeout();
    }
  };

  const checkWhenVisible = () => {
    if (document.visibilityState !== 'visible') return;
    const storedActivity = readTimestamp(LAST_ACTIVITY_KEY);
    if (storedActivity && storedActivity > lastActivity) lastActivity = storedActivity;
    if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) expire('inactive');
    else scheduleTimeout();
  };

  markSessionActivity();
  lastActivity = Date.now();
  lastPersistedActivity = lastActivity;
  scheduleTimeout();
  for (const eventName of ACTIVITY_EVENTS) {
    window.addEventListener(eventName, recordActivity, { passive: true });
  }
  window.addEventListener('storage', syncActivity);
  document.addEventListener('visibilitychange', checkWhenVisible);
  return () => {
    stopped = true;
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    for (const eventName of ACTIVITY_EVENTS) {
      window.removeEventListener(eventName, recordActivity);
    }
    window.removeEventListener('storage', syncActivity);
    document.removeEventListener('visibilitychange', checkWhenVisible);
  };
}
