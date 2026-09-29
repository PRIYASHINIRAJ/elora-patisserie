// In-browser SQLite (sql.js). Same SQL and the same `db.prepare(sql).get/all/run()`
// shape the controllers were written for. The first visit loads the starting
// catalogue (public/data/elora-initial.sqlite); after that the visitor's copy is
// saved in their browser after every change.
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { getItem, setItem } from '../storage.js';

const SAVED_KEY = 'database';

let sqlDb;

async function load() {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  let bytes = await getItem('kv', SAVED_KEY).catch(() => null);
  if (!bytes) {
    const res = await fetch(`${import.meta.env.BASE_URL}data/elora-initial.sqlite`);
    if (!res.ok) throw new Error('Could not load the starting catalogue.');
    bytes = new Uint8Array(await res.arrayBuffer());
  }
  sqlDb = new SQL.Database(bytes);
  sqlDb.run('PRAGMA foreign_keys = ON');
}

export const dbReady = load();

// Writes are batched into one save per tick.
let saveTimer;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const bytes = sqlDb.export();
    sqlDb.run('PRAGMA foreign_keys = ON'); // export() resets connection pragmas
    setItem('kv', SAVED_KEY, bytes).catch((err) => console.warn('Élora: could not save changes', err));
  }, 0);
}

function clean(v) {
  return v === undefined ? null : typeof v === 'boolean' ? Number(v) : v;
}

// Accepts positional values, a single array, or one object of named params
// (the SQL uses @name; the object keys are bare names).
function bindArgs(params) {
  if (params.length === 1 && params[0] && typeof params[0] === 'object' && !Array.isArray(params[0])) {
    return Object.fromEntries(Object.entries(params[0]).map(([k, v]) => [`@${k}`, clean(v)]));
  }
  const list = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
  return list.map(clean);
}

function query(sql, params) {
  const stmt = sqlDb.prepare(sql);
  try {
    // sql.js rejects named keys that are not in the statement, so keep only used ones.
    let args = bindArgs(params);
    if (!Array.isArray(args)) {
      args = Object.fromEntries(Object.entries(args).filter(([k]) => sql.includes(k)));
    }
    stmt.bind(args);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    return rows;
  } finally {
    stmt.free();
  }
}

const isWrite = (sql) => !/^\s*(SELECT|PRAGMA|WITH)\b/i.test(sql);

const db = {
  prepare(sql) {
    return {
      async get(...params) {
        await dbReady;
        return query(sql, params)[0];
      },
      async all(...params) {
        await dbReady;
        return query(sql, params);
      },
      async run(...params) {
        await dbReady;
        query(sql, params);
        const changes = sqlDb.getRowsModified();
        const lastInsertRowid = sqlDb.exec('SELECT last_insert_rowid()')[0].values[0][0];
        if (isWrite(sql)) scheduleSave();
        return { changes, lastInsertRowid };
      },
    };
  },
  async exec(sql) {
    await dbReady;
    sqlDb.exec(sql);
    scheduleSave();
  },
};

export default db;
