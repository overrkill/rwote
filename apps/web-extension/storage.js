// storage.js — Chrome Storage Wrapper + Operation Queue

// ── Storage Keys ───────────────────────────────────────
const STORAGE_KEYS = {
  NOTES: 'rwote_v1',
  TAGS: 'rwote_tags_v1',
  AUTH: 'rwote_auth_v1',
  AUTH_REFRESH: 'rwote_auth_refresh_v1',
  SETTINGS: 'rwote_settings_v1',
  ONBOARD: 'rwote_onboard_v1',
  MODE: 'rwote_mode_v1',
  PENDING_SELECTION: 'pendingSelection',
  LAST_SYNCED: 'rwote_last_sync_v1',
  OPERATION_QUEUE: 'rwote_op_queue_v1'
};

// ── Storage Wrapper ─────────────────────────────────────
const storage = {
  get(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  },
  set(obj) {
    return new Promise(resolve => chrome.storage.local.set(obj, resolve));
  },
  remove(keys) {
    return new Promise(resolve => chrome.storage.local.remove(keys, resolve));
  },
  clear() {
    return new Promise(resolve => chrome.storage.local.clear(resolve));
  },
  sessionGet(keys) {
    return new Promise(resolve => chrome.storage.session.get(keys, resolve));
  },
  sessionSet(obj) {
    return new Promise(resolve => chrome.storage.session.set(obj, resolve));
  },
  sessionRemove(keys) {
    return new Promise(resolve => chrome.storage.session.remove(keys, resolve));
  },
  sessionClear() {
    return new Promise(resolve => chrome.storage.session.clear(resolve));
  }
};

// ── Operation Queue ─────────────────────────────────────
const MAX_RETRY_ATTEMPTS = 3;

async function getQueue() {
  const res = await storage.get(STORAGE_KEYS.OPERATION_QUEUE);
  return res[STORAGE_KEYS.OPERATION_QUEUE] || [];
}

async function saveQueue(queue) {
  await storage.set({ [STORAGE_KEYS.OPERATION_QUEUE]: queue });
}

async function addToQueue(operation) {
  const queue = await getQueue();
  const op = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...operation,
    attempts: 0,
    createdAt: Date.now()
  };
  queue.push(op);
  await saveQueue(queue);
  return op;
}

async function removeFromQueue(opId) {
  const queue = await getQueue();
  const filtered = queue.filter(op => op.id !== opId);
  await saveQueue(filtered);
}

async function updateQueueItem(opId, updates) {
  const queue = await getQueue();
  const idx = queue.findIndex(op => op.id === opId);
  if (idx !== -1) {
    queue[idx] = { ...queue[idx], ...updates };
    await saveQueue(queue);
  }
}

async function broadcastQueueFailures(failedOps) {
  chrome.runtime.sendMessage({
    type: 'SYNC_FAILED',
    operations: failedOps.map(op => ({
      type: op.type,
      noteId: op.note?.id || op.noteId,
      error: op.error
    }))
  }).catch(() => {});
}