const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { createServer } = require('../src/server');
const { resetDb } = require('../src/lib/db');

function request(server, path, options = {}) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

test('End-to-End User Journey: Admin setup, multiple student attendees, live telemetry, and AI diagnosis', async () => {
  resetDb();
  const app = createServer();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));

  try {
    // 1. Admin creates Exam Session
    const createRes = await request(app, '/api/sessions', {
      method: 'POST',
      body: {
        title: 'Operating Systems Midterm 2026',
        topic: 'Operating Systems',
        questionLimit: 5,
        timeLimitMinutes: 15,
        mode: 'exam'
      }
    });
    assert.strictEqual(createRes.status, 201);
    const session = createRes.data.session;
    assert.ok(session.code.startsWith('CS-'));
    assert.strictEqual(session.question_ids.length, 5);

    // 2. Student 1 (Rahul) joins with session code
    const rahulJoin = await request(app, `/api/sessions/${session.code}/join`, {
      method: 'POST',
      body: { studentName: 'Rahul Sharma' }
    });
    assert.strictEqual(rahulJoin.status, 200);
    const rahul = rahulJoin.data.attendee;

    // 3. Student 2 (Elena) joins with same session code
    const elenaJoin = await request(app, `/api/sessions/${session.code}/join`, {
      method: 'POST',
      body: { studentName: 'Elena Rostova' }
    });
    assert.strictEqual(elenaJoin.status, 200);
    const elena = elenaJoin.data.attendee;

    // 4. Rahul submits correct answer to OS question 1
    const rahulSub = await request(app, '/api/diagnose', {
      method: 'POST',
      body: {
        attendeeId: rahul.id,
        questionId: 'os-1',
        studentAnswer: 'Impose a strict global linear ordering on all resource types'
      }
    });
    assert.strictEqual(rahulSub.data.isCorrect, true);
    assert.strictEqual(rahulSub.data.score, 100);

    // 5. Elena submits incorrect answer to OS question 1
    const elenaSub = await request(app, '/api/diagnose', {
      method: 'POST',
      body: {
        attendeeId: elena.id,
        questionId: 'os-1',
        studentAnswer: 'Allow preemption of currently held resources'
      }
    });
    assert.strictEqual(elenaSub.data.isCorrect, false);
    assert.strictEqual(elenaSub.data.score, 0);
    assert.ok(elenaSub.data.whyConfused.includes('preemption'));

    // 6. Admin checks live roster telemetry
    const rosterRes = await request(app, `/api/sessions/${session.id}/roster`);
    assert.strictEqual(rosterRes.status, 200);
    const roster = rosterRes.data.roster;
    assert.strictEqual(roster.length, 2);

    const rahulRoster = roster.find(r => r.id === rahul.id);
    const elenaRoster = roster.find(r => r.id === elena.id);
    assert.strictEqual(rahulRoster.score, 100);
    assert.strictEqual(elenaRoster.score, 0);
    assert.ok(elenaRoster.last_misconception.length > 10);

    // 7. Complete session
    const compRes = await request(app, `/api/sessions/${session.code}/complete`, {
      method: 'POST',
      body: { attendeeId: rahul.id }
    });
    assert.strictEqual(compRes.status, 200);
    assert.strictEqual(compRes.data.attendee.status, 'completed');

    // 8. Open Practice test
    const practiceRes = await request(app, `/api/questions?topic=${encodeURIComponent('Database Management Systems (DBMS)')}&limit=5`);
    assert.strictEqual(practiceRes.status, 200);
    assert.strictEqual(practiceRes.data.questions.length, 5);

    // 9. AI Question Generator test
    const aiGenRes = await request(app, '/api/questions/ai-generate', {
      method: 'POST',
      body: { topic: 'Computer Networks' }
    });
    assert.strictEqual(aiGenRes.status, 200);
    assert.ok(aiGenRes.data.question.title);
    assert.ok(aiGenRes.data.question.misconception_key);
  } finally {
    app.close();
  }
});
