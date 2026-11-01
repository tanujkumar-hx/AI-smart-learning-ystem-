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
        res.on('data', (chunk) => (data += chunk));
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

test('HTTP API Server handles topics, session creation, student join, and diagnosis', async () => {
  resetDb();
  const app = createServer();
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));

  try {
    // 1. Fetch topics
    const topicsRes = await request(app, '/api/topics');
    assert.strictEqual(topicsRes.status, 200);
    assert.strictEqual(topicsRes.data.topics.length, 6);

    // 1.5. Test Admin Login Passcode Gate
    const badLogin = await request(app, '/api/admin/login', {
      method: 'POST',
      body: { passcode: 'wrongpassword' }
    });
    assert.strictEqual(badLogin.status, 401);

    const goodLogin = await request(app, '/api/admin/login', {
      method: 'POST',
      body: { passcode: 'admin123' }
    });
    assert.strictEqual(goodLogin.status, 200);
    assert.strictEqual(goodLogin.data.success, true);

    // 2. Create session
    const createRes = await request(app, '/api/sessions', {
      method: 'POST',
      body: {
        title: 'Networks Assessment',
        topic: 'Computer Networks',
        questionLimit: 5,
        timeLimitMinutes: 20,
        mode: 'exam'
      }
    });
    assert.strictEqual(createRes.status, 201);
    const session = createRes.data.session;
    assert.ok(session.code.startsWith('CS-'));

    // 3. Student joins session
    const joinRes = await request(app, `/api/sessions/${session.code}/join`, {
      method: 'POST',
      body: { studentName: 'Alex Rivera' }
    });
    assert.strictEqual(joinRes.status, 200);
    const attendee = joinRes.data.attendee;
    assert.strictEqual(attendee.student_name, 'Alex Rivera');

    // 4. Submit and diagnose answer
    const diagRes = await request(app, '/api/diagnose', {
      method: 'POST',
      body: {
        attendeeId: attendee.id,
        questionId: 'net-1',
        studentAnswer: 'To negotiate public encryption keys'
      }
    });
    assert.strictEqual(diagRes.status, 200);
    assert.strictEqual(diagRes.data.isCorrect, false);
    assert.ok(diagRes.data.whyConfused.length > 20);

    // 5. Check live roster
    const rosterRes = await request(app, `/api/sessions/${session.id}/roster`);
    assert.strictEqual(rosterRes.status, 200);
    assert.strictEqual(rosterRes.data.roster.length, 1);
    assert.strictEqual(rosterRes.data.roster[0].student_name, 'Alex Rivera');
  } finally {
    app.close();
  }
});
