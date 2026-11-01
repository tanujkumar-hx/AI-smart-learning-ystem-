const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'learning_system.json');

const INITIAL_SCHEMA = {
  sessions: [],
  questions: [],
  attendees: [],
  submissions: []
};

let dbCache = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDb() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    saveDb(INITIAL_SCHEMA);
    dbCache = JSON.parse(JSON.stringify(INITIAL_SCHEMA));
    return dbCache;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);
    return dbCache;
  } catch (err) {
    dbCache = JSON.parse(JSON.stringify(INITIAL_SCHEMA));
    return dbCache;
  }
}

function getDb() {
  if (!dbCache) {
    dbCache = loadDb();
  }
  return dbCache;
}

function saveDb(data = null) {
  ensureDataDir();
  const toSave = data || dbCache || INITIAL_SCHEMA;
  fs.writeFileSync(DB_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
}

function resetDb() {
  dbCache = JSON.parse(JSON.stringify(INITIAL_SCHEMA));
  saveDb(dbCache);
  return dbCache;
}

module.exports = {
  getDb,
  saveDb,
  resetDb
};
