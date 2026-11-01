const test = require('node:test');
const assert = require('node:assert');
const { getDb, resetDb } = require('../src/lib/db');

test('Database Initialization creates tables and structure successfully', () => {
  resetDb();
  const db = getDb();
  assert.ok(db.sessions, 'sessions table should exist');
  assert.ok(db.questions, 'questions table should exist');
  assert.ok(db.attendees, 'attendees table should exist');
  assert.ok(db.submissions, 'submissions table should exist');
  assert.strictEqual(Array.isArray(db.sessions), true);
  assert.strictEqual(Array.isArray(db.questions), true);
  assert.strictEqual(Array.isArray(db.attendees), true);
  assert.strictEqual(Array.isArray(db.submissions), true);
});
