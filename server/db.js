// MongoDB (Atlas) persistence with an in-memory working copy.
//
// On startup every collection is loaded into memory, so request handlers stay
// simple and synchronous. Every change is written back to MongoDB shortly
// after (save() diffs each document against what was last written and only
// upserts/deletes what changed). Run ONE server process per database.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { MongoClient } from "mongodb";
import { seedData } from "./seed.js";

export const DATA_DIR = process.env.DATA_DIR || path.join(import.meta.dirname, "data");
const LEGACY_FILE = path.join(DATA_DIR, "db.json");
const KV_KEYS = ["settings", "meta"]; // single objects, stored in the "kv" collection

let client = null;
let mdb = null;
let state = null;
const synced = new Map(); // `${collection}:${id}` -> JSON last written
let saveTimer = null;
let flushing = Promise.resolve();

const collectionNames = () => Object.keys(seedData()).filter((k) => !KV_KEYS.includes(k));

export async function loadDb() {
  const uri = process.env.MONGODB_URI;
  let mongoConnected = false;

  if (uri) {
    try {
      client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      mdb = client.db(process.env.MONGODB_DB || "droptaxi");
      mongoConnected = true;
    } catch (err) {
      console.warn(`\n[db] ⚠️  MongoDB Atlas connection failed: ${err.message}`);
      console.warn("[db] 💡 Note: Check your MONGODB_URI username/password in .env or Atlas IP Whitelist (0.0.0.0/0).");
      console.warn("[db] 🚀 Falling back to local file database at server/data/db.json\n");
      client = null;
      mdb = null;
    }
  } else {
    console.warn("\n[db] ⚠️  MONGODB_URI is not set. Running in local file database mode (server/data/db.json).\n");
  }

  const fresh = seedData();

  if (mongoConnected && mdb) {
    const kv = await mdb.collection("kv").find().toArray();
    const isEmpty = kv.length === 0 && (await mdb.collection("vehicles").estimatedDocumentCount()) === 0;

    if (isEmpty) {
      // First run: import the old JSON file if there is one, otherwise seed defaults.
      const legacy = fs.existsSync(LEGACY_FILE) ? JSON.parse(fs.readFileSync(LEGACY_FILE, "utf-8")) : null;
      state = { ...fresh, ...(legacy ?? {}) };
      state.settings = { ...fresh.settings, ...state.settings };
      console.log(legacy ? "[db] Imported server/data/db.json into MongoDB" : "[db] Empty database — seeded default vehicles, routes and settings");
    } else {
      state = {};
      for (const name of collectionNames()) {
        state[name] = (await mdb.collection(name).find().toArray()).map(({ _id, ...doc }) => ({ ...doc, id: _id }));
        for (const doc of state[name]) synced.set(`${name}:${doc.id}`, JSON.stringify(doc));
      }
      for (const k of KV_KEYS) {
        const row = kv.find((r) => r._id === k);
        state[k] = row?.value ?? fresh[k];
        if (row) synced.set(`kv:${k}`, JSON.stringify(row.value));
      }
      state.settings = { ...fresh.settings, ...state.settings };
    }

    await mdb.collection("bookings").createIndex({ createdAt: -1 });
    await mdb.collection("customers").createIndex({ phoneKey: 1 });
    await mdb.collection("admins").createIndex({ email: 1 });
    await flush();
    console.log(`[db] Connected to MongoDB database "${mdb.databaseName}"`);
  } else {
    // Local JSON fallback
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(LEGACY_FILE)) {
      try {
        const legacy = JSON.parse(fs.readFileSync(LEGACY_FILE, "utf-8"));
        state = { ...fresh, ...(legacy ?? {}) };
        state.settings = { ...fresh.settings, ...state.settings };
        console.log("[db] Loaded data from local server/data/db.json");
      } catch (err) {
        state = fresh;
        fs.writeFileSync(LEGACY_FILE, JSON.stringify(state, null, 2), "utf-8");
        console.log("[db] Initialized fresh defaults in server/data/db.json");
      }
    } else {
      state = fresh;
      fs.writeFileSync(LEGACY_FILE, JSON.stringify(state, null, 2), "utf-8");
      console.log("[db] Created server/data/db.json with default seed data");
    }
  }

  return state;
}

async function flush() {
  if (mdb) {
    for (const name of collectionNames()) {
      const docs = state[name] ?? [];
      const ops = [];
      const present = new Set();
      for (const doc of docs) {
        if (!doc.id) doc.id = newId();
        present.add(doc.id);
        const json = JSON.stringify(doc);
        if (synced.get(`${name}:${doc.id}`) !== json) {
          const { id, ...rest } = structuredClone(doc);
          ops.push({ replaceOne: { filter: { _id: id }, replacement: rest, upsert: true } });
          synced.set(`${name}:${doc.id}`, json);
        }
      }
      for (const key of synced.keys()) {
        if (!key.startsWith(name + ":")) continue;
        const id = key.slice(name.length + 1);
        if (!present.has(id)) {
          ops.push({ deleteOne: { filter: { _id: id } } });
          synced.delete(key);
        }
      }
      if (ops.length) await mdb.collection(name).bulkWrite(ops, { ordered: false });
    }
    for (const k of KV_KEYS) {
      const json = JSON.stringify(state[k]);
      if (synced.get(`kv:${k}`) !== json) {
        await mdb.collection("kv").replaceOne({ _id: k }, { value: state[k] }, { upsert: true });
        synced.set(`kv:${k}`, json);
      }
    }
  }

  // Also persist to local JSON file for backup / offline mode
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(LEGACY_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("[db] Error writing local db.json backup:", err.message);
  }
}

// Schedule a write-back. Writes are serialised so they never overlap.
export function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    flushing = flushing.then(flush).catch((err) => {
      console.error("[db] MongoDB write failed, will retry:", err.message);
      // Forget what we think is synced so the next save rewrites everything.
      synced.clear();
      setTimeout(save, 5000);
    });
  }, 50);
}

export async function closeDb() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
    flushing = flushing.then(flush);
  }
  await flushing;
  await client?.close();
}

export function db() {
  if (!state) throw new Error("Database not loaded yet");
  return state;
}

export const newId = () => crypto.randomUUID();
export const now = () => new Date().toISOString();

// ---- Generic collection helpers ----
export function list(name) {
  return db()[name];
}

export function findById(name, id) {
  return db()[name].find((x) => x.id === id);
}

export function insert(name, doc) {
  const item = { id: newId(), createdAt: now(), updatedAt: now(), ...doc };
  db()[name].push(item);
  save();
  return item;
}

export function update(name, id, patch) {
  const item = findById(name, id);
  if (!item) return null;
  Object.assign(item, patch, { id, updatedAt: now() });
  save();
  return item;
}

export function remove(name, id) {
  const arr = db()[name];
  const idx = arr.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  arr.splice(idx, 1);
  save();
  return true;
}

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.once(sig, () => {
    closeDb().finally(() => process.exit(0));
  });
}
