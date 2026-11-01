const test = require('node:test');
const assert = require('node:assert');
const { resetDb } = require('../src/lib/db');
const {
  createSession,
  getSessionByCode,
  joinSession,
  recordSubmission,
  getSessionRoster,
  getAllSessions
} = require('../src/lib/sessions');

test('Session & Attendance Management handles session creation, student join, and live progress', () => {
  resetDb();

  const session = createSession({
    title: 'OS Midterm Assessment',
    topic: 'Operating Systems',
    questionLimit: 10,
    timeLimitMinutes: 30,
    mode: 'exam'
  });

  assert.ok(session.id);
  assert.ok(session.code.startsWith('CS-'), 'Code should start with CS-');
  assert.strictEqual(session.question_limit, 10);
  assert.strictEqual(session.mode, 'exam');

  const fetched = getSessionByCode(session.code);
  assert.strictEqual(fetched.id, session.id);

  // Student joins
  const attendee = joinSession(session.code, 'Elena Rostova');
  assert.ok(attendee.id);
  assert.strictEqual(attendee.student_name, 'Elena Rostova');
  assert.strictEqual(attendee.session_id, session.id);

  // Student submits answer
  recordSubmission({
    attendeeId: attendee.id,
    questionId: 'os-1',
    studentAnswer: 'Linear ordering',
    isCorrect: true,
    whyConfused: 'Understood circular wait prevention',
    score: 100
  });

  // Verify live roster
  const roster = getSessionRoster(session.id);
  assert.strictEqual(roster.length, 1);
  assert.strictEqual(roster[0].student_name, 'Elena Rostova');
  assert.strictEqual(roster[0].answered_count, 1);
  assert.strictEqual(roster[0].score, 100);

  const all = getAllSessions();
  assert.strictEqual(all.length, 1);
});
