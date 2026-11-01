const http = require('http');
const fs = require('fs');
const path = require('path');

const {
  TOPICS,
  getTopics,
  getAllQuestions,
  getQuestionsByTopic,
  getQuestionById,
  addCustomQuestion,
  seedDatabaseIfEmpty
} = require('./lib/questions');

const {
  createSession,
  getSessionByCode,
  getSessionById,
  getAllSessions,
  joinSession,
  recordSubmission,
  getSessionRoster,
  completeSessionForAttendee
} = require('./lib/sessions');

const {
  diagnoseConfusion,
  generateAIQuestion
} = require('./lib/ai-diagnostics');

// Ensure seed questions are populated
seedDatabaseIfEmpty();

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function createServer() {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const pathname = parsedUrl.pathname;
    const query = Object.fromEntries(parsedUrl.searchParams.entries());
    const method = req.method;

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }

    // ==========================================
    // API ROUTES
    // ==========================================

    // GET /api/network-info
    if (method === 'GET' && pathname === '/api/network-info') {
      const port = server.address() ? server.address().port : (process.env.PORT || 3000);
      const interfaces = require('os').networkInterfaces();
      let lanIp = 'localhost';
      for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            lanIp = net.address;
            break;
          }
        }
      }
      return sendJson(res, 200, {
        port,
        lanIp,
        lanUrl: `http://${lanIp}:${port}`,
        localUrl: `http://localhost:${port}`
      });
    }

    // POST /api/admin/login
    if (method === 'POST' && pathname === '/api/admin/login') {
      const body = await parseBody(req);
      if (body.passcode === ADMIN_PASSCODE) {
        return sendJson(res, 200, { success: true, message: 'Admin verified successfully' });
      } else {
        return sendJson(res, 401, { error: 'Invalid admin passcode. Access denied.' });
      }
    }

    // GET /api/topics
    if (method === 'GET' && pathname === '/api/topics') {
      return sendJson(res, 200, { topics: getTopics() });
    }

    // GET /api/questions
    if (method === 'GET' && pathname === '/api/questions') {
      const topic = query.topic;
      const limit = query.limit ? parseInt(query.limit, 10) : null;
      let questions = [];
      if (topic) {
        questions = getQuestionsByTopic(topic, limit);
      } else {
        questions = getAllQuestions().slice(0, limit || 20);
      }
      return sendJson(res, 200, { questions });
    }

    // POST /api/questions/custom
    if (method === 'POST' && pathname === '/api/questions/custom') {
      const body = await parseBody(req);
      if (!body.prompt || !body.correct_answer) {
        return sendJson(res, 400, { error: 'Prompt and correct_answer are required' });
      }
      const q = addCustomQuestion(body);
      return sendJson(res, 201, { question: q });
    }

    // POST /api/questions/ai-generate
    if (method === 'POST' && pathname === '/api/questions/ai-generate') {
      const body = await parseBody(req);
      const topic = body.topic || 'Operating Systems';
      const q = await generateAIQuestion(topic, body.type || 'mcq');
      return sendJson(res, 200, { question: q });
    }

    // GET /api/sessions
    if (method === 'GET' && pathname === '/api/sessions') {
      return sendJson(res, 200, { sessions: getAllSessions() });
    }

    // POST /api/sessions
    if (method === 'POST' && pathname === '/api/sessions') {
      const body = await parseBody(req);
      const session = createSession(body);
      return sendJson(res, 201, { session });
    }

    // GET /api/sessions/:codeOrId
    if (method === 'GET' && pathname.startsWith('/api/sessions/')) {
      const parts = pathname.split('/').filter(Boolean);
      const codeOrId = parts[2];

      // Match GET /api/sessions/:id/roster
      if (parts[3] === 'roster') {
        const roster = getSessionRoster(codeOrId);
        return sendJson(res, 200, { roster });
      }

      const session = getSessionByCode(codeOrId) || getSessionById(codeOrId);
      if (!session) {
        return sendJson(res, 404, { error: 'Session not found' });
      }

      // Populate questions
      const questions = (session.question_ids || []).map(id => getQuestionById(id)).filter(Boolean);
      return sendJson(res, 200, { session, questions });
    }

    // POST /api/sessions/:code/join
    if (method === 'POST' && pathname.includes('/join')) {
      const code = pathname.split('/')[3];
      const body = await parseBody(req);
      try {
        const attendee = joinSession(code, body.studentName);
        const session = getSessionByCode(code);
        const questions = (session.question_ids || []).map(id => getQuestionById(id)).filter(Boolean);
        return sendJson(res, 200, { attendee, session, questions });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }

    // POST /api/sessions/:code/complete
    if (method === 'POST' && pathname.includes('/complete')) {
      const body = await parseBody(req);
      const attendee = completeSessionForAttendee(body.attendeeId);
      return sendJson(res, 200, { attendee });
    }

    // POST /api/diagnose
    if (method === 'POST' && pathname === '/api/diagnose') {
      const body = await parseBody(req);
      const { attendeeId, questionId, studentAnswer } = body;
      const question = getQuestionById(questionId);

      if (!question) {
        return sendJson(res, 404, { error: 'Question not found' });
      }

      const diagnosis = await diagnoseConfusion(question, studentAnswer);

      // Record in attendance telemetry if attendeeId provided
      if (attendeeId) {
        try {
          recordSubmission({
            attendeeId,
            questionId,
            studentAnswer,
            isCorrect: diagnosis.isCorrect,
            whyConfused: diagnosis.whyConfused,
            score: diagnosis.score
          });
        } catch (err) {
          console.error('Submission recording error:', err.message);
        }
      }

      return sendJson(res, 200, diagnosis);
    }

    // ==========================================
    // STATIC ASSETS & HTML SERVING
    // ==========================================

    if (pathname === '/app.js') {
      const jsPath = path.join(__dirname, 'public/app.js');
      if (fs.existsSync(jsPath)) {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
        return res.end(fs.readFileSync(jsPath));
      }
    }

    // Default HTML page for any non-API route
    const htmlPath = path.join(__dirname, 'public/app.html');
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(htmlPath));
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  return server;
}

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const HOST = '0.0.0.0';
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 AI Smart Learning System is LIVE!`);
    console.log(`Local Access:   http://localhost:${PORT}`);
    console.log(`Network Access: http://10.133.251.129:${PORT}`);
    console.log(`Admin Center:   http://localhost:${PORT}/admin`);
    console.log(`=================================================\n`);
  });
}

module.exports = {
  createServer
};
