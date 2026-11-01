// AI Smart Learning System - Client Application

let currentSession = null;
let currentAttendee = null;
let sessionQuestions = [];
let activeQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let remainingSeconds = 0;
let rosterInterval = null;

// Routing & View switching
function showView(view, params = {}) {
  clearInterval(timerInterval);
  clearInterval(rosterInterval);
  const root = document.getElementById('app-root');

  if (view === 'home') {
    renderHomeView(root);
  } else if (view === 'admin') {
    renderAdminView(root);
  } else if (view === 'session') {
    renderSessionView(root, params.code);
  } else if (view === 'practice') {
    renderOpenPracticeView(root);
  }
}

// ==========================================
// 1. HOME VIEW
// ==========================================
function renderHomeView(root) {
  root.innerHTML = `
    <div class="py-12 space-y-12">
      <!-- Hero Section -->
      <div class="text-center max-w-3xl mx-auto space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <span>✨ Powered by Intelligent Misconception Analysis</span>
        </div>
        <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight">
          Master Computer Science with an <span class="gradient-text">Adaptive AI Tutor</span>
        </h1>
        <p class="text-slate-400 text-lg">
          Practice questions across Operating Systems, Algorithms, Databases, and Networks. When you get stuck, the AI analyzes <span class="text-indigo-300 font-semibold">why you got confused</span> and provides deep conceptual clarity.
        </p>
      </div>

      <!-- Action Split Cards -->
      <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <!-- Join Exam / Session Card -->
        <div class="glass-card-glow rounded-2xl p-8 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-2xl">🎓</span>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Direct Join</span>
            </div>
            <h2 class="text-2xl font-bold text-white">Join Exam or Class Session</h2>
            <p class="text-slate-400 text-sm">
              Have a session code from your instructor? Enter it below to join the live assessment immediately.
            </p>
            <div class="space-y-3 pt-2">
              <input id="input-session-code" type="text" placeholder="e.g. CS-2026-X" class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white font-mono uppercase tracking-wider focus:outline-none focus:border-indigo-500 transition">
              <input id="input-student-name" type="text" placeholder="Your Full Name" class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition">
            </div>
          </div>
          <button onclick="handleJoinSession()" class="mt-6 w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition text-white">
            Enter Assessment Session →
          </button>
        </div>

        <!-- Open Practice Card -->
        <div class="glass-card rounded-2xl p-8 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-2xl">⚡</span>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Self-Paced</span>
            </div>
            <h2 class="text-2xl font-bold text-white">Open Practice Arena</h2>
            <p class="text-slate-400 text-sm">
              Practice 60+ curriculum-aligned questions across 6 computer science disciplines with instant AI explanations after every attempt.
            </p>
            <div class="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
              <div class="p-2.5 rounded-lg bg-slate-800/50 border border-white/5">🖥️ Operating Systems</div>
              <div class="p-2.5 rounded-lg bg-slate-800/50 border border-white/5">⚡ Data Structures</div>
              <div class="p-2.5 rounded-lg bg-slate-800/50 border border-white/5">🗄️ Database (DBMS)</div>
              <div class="p-2.5 rounded-lg bg-slate-800/50 border border-white/5">🌐 Networks & TCP</div>
            </div>
          </div>
          <button onclick="showView('practice')" class="mt-6 w-full py-3.5 bg-slate-800 hover:bg-slate-700 border border-white/10 font-bold rounded-xl transition text-white">
            Start Free Practice →
          </button>
        </div>
      </div>
    </div>
  `;
}

// Join session handler
async function handleJoinSession() {
  const code = document.getElementById('input-session-code').value.trim();
  const name = document.getElementById('input-student-name').value.trim();
  if (!code) return alert('Please enter a session code');
  if (!name) return alert('Please enter your name');

  try {
    const res = await fetch(`/api/sessions/${encodeURIComponent(code)}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName: name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join session');

    currentAttendee = data.attendee;
    currentSession = data.session;
    sessionQuestions = data.questions;
    activeQuestionIndex = 0;
    userAnswers = {};

    showView('session', { code });
  } catch (err) {
    alert(err.message);
  }
}

// ==========================================
// 2. ADMIN AUTHENTICATION & COMMAND CENTER
// ==========================================
function isAdminAuthenticated() {
  return localStorage.getItem('admin_authenticated') === 'true' || sessionStorage.getItem('admin_authenticated') === 'true';
}

function renderAdminLoginGate(root) {
  root.innerHTML = `
    <div class="max-w-md mx-auto py-16 space-y-6 animate-in fade-in zoom-in duration-200">
      <div class="glass-card-glow rounded-3xl p-8 text-center space-y-6">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30">
          🔐
        </div>
        <div>
          <span class="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">Restricted Admin Access</span>
          <h2 class="text-2xl font-extrabold text-white mt-1">Admin Command Center</h2>
          <p class="text-slate-400 text-xs mt-1.5 leading-relaxed">Enter your Secret Master Admin Passcode to configure exams, author questions, and inspect live student attendance.</p>
        </div>

        <form onsubmit="handleAdminLogin(event)" class="space-y-4">
          <div>
            <input id="admin-passcode-input" type="password" placeholder="Enter Secret Admin Passcode" required class="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-widest text-lg font-mono focus:outline-none focus:border-indigo-500 transition">
          </div>

          <div class="flex items-center justify-between text-xs text-slate-400 px-1">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="admin-remember-me" checked class="rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-0">
              <span>Stay logged in on this device</span>
            </label>
          </div>

          <div id="admin-login-error" class="hidden text-rose-400 text-xs font-medium bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20"></div>

          <button id="admin-login-btn" type="submit" class="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition text-white text-sm">
            Unlock Admin Authority →
          </button>
        </form>
      </div>
    </div>
  `;
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const input = document.getElementById('admin-passcode-input');
  const passcode = (input.value || '').trim();
  const errorEl = document.getElementById('admin-login-error');
  const btn = document.getElementById('admin-login-btn');
  const remember = document.getElementById('admin-remember-me').checked;

  btn.disabled = true;
  btn.textContent = 'Verifying Passcode...';
  errorEl.classList.add('hidden');

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Access denied');

    // Store persistently so it never asks again on this browser
    if (remember) {
      localStorage.setItem('admin_authenticated', 'true');
    }
    sessionStorage.setItem('admin_authenticated', 'true');

    renderAdminView(document.getElementById('app-root'));
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Unlock Admin Authority →';
  }
}

function handleAdminLogout() {
  localStorage.removeItem('admin_authenticated');
  sessionStorage.removeItem('admin_authenticated');
  showView('home');
}

async function renderAdminView(root) {
  if (!isAdminAuthenticated()) {
    renderAdminLoginGate(root);
    return;
  }

  root.innerHTML = `
    <div class="space-y-8 py-4">
      <!-- Admin Header Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div class="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span>👑 Command & Authority Center</span>
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">Admin Verified</span>
          </div>
          <h1 class="text-3xl font-extrabold text-white">AI Smart Learning System Dashboard</h1>
          <p class="text-slate-400 text-sm mt-1">Configure exams, share instant student links, author questions, and monitor live attendance.</p>
        </div>
        <div class="flex items-center gap-3">
          <button onclick="handleAdminLogout()" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 font-semibold rounded-xl text-slate-300 text-xs border border-white/10 transition flex items-center gap-1.5">
            <span>🔒 Lock & Logout</span>
          </button>
          <button onclick="openCreateSessionModal()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-2">
            <span>+ Create New Exam Session</span>
          </button>
        </div>
      </div>

      <!-- Active Sessions & Links Hero -->
      <div id="admin-sessions-container" class="space-y-4">
        <div class="text-slate-400 text-sm">Loading active sessions...</div>
      </div>

      <!-- Two Column Layout: Question Creator + Live Attendee Monitor -->
      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Question Studio Card -->
        <div class="glass-card rounded-2xl p-6 space-y-6">
          <div class="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <span>✏️ Question Setup Studio</span>
              </h2>
              <p class="text-slate-400 text-xs">Author new questions or trigger AI generation</p>
            </div>
            <button onclick="handleAIGenerateQuestion()" class="px-3.5 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 text-xs font-semibold transition">
              ✨ AI Generate Question
            </button>
          </div>

          <form id="form-create-question" onsubmit="handleCreateCustomQuestion(event)" class="space-y-4 text-sm">
            <div>
              <label class="block text-slate-400 text-xs font-medium mb-1.5">Topic</label>
              <select id="q-topic" class="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white">
                <option>Data Structures & Algorithms</option>
                <option>Operating Systems</option>
                <option>Database Management Systems (DBMS)</option>
                <option>Computer Networks</option>
                <option>OOP & System Design</option>
                <option>Web & Full Stack Systems</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-400 text-xs font-medium mb-1.5">Question Title</label>
              <input id="q-title" type="text" placeholder="e.g. TCP 3-Way Handshake SYN Floods" required class="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white">
            </div>

            <div>
              <label class="block text-slate-400 text-xs font-medium mb-1.5">Question Prompt</label>
              <textarea id="q-prompt" rows="2" placeholder="Write question details..." required class="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white"></textarea>
            </div>

            <div>
              <label class="block text-slate-400 text-xs font-medium mb-1.5">Correct Answer</label>
              <input id="q-correct" type="text" placeholder="Exact correct answer" required class="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white">
            </div>

            <div>
              <label class="block text-slate-400 text-xs font-medium mb-1.5">AI Misconception Diagnostic Key</label>
              <textarea id="q-misconception" rows="2" placeholder="Why do students get confused on this topic? (Explains their flawed intuition)" class="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white"></textarea>
            </div>

            <button type="submit" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg font-semibold text-white transition">
              Save Question to System Bank
            </button>
          </form>
        </div>

        <!-- Live Attendee & Submission Monitor -->
        <div class="glass-card rounded-2xl p-6 space-y-6">
          <div class="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <span>👥 Live Attendance & Exam Telemetry</span>
              </h2>
              <p class="text-slate-400 text-xs">Real-time student progress and scores</p>
            </div>
            <span class="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Tracking
            </span>
          </div>

          <div id="admin-roster-container" class="overflow-x-auto text-sm">
            <p class="text-slate-500 text-xs">Select or create a session to monitor attendee progress.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  loadAdminSessions();
}

async function loadAdminSessions() {
  const container = document.getElementById('admin-sessions-container');
  try {
    const res = await fetch('/api/sessions');
    const data = await res.json();
    const sessions = data.sessions || [];

    if (sessions.length === 0) {
      container.innerHTML = `
        <div class="glass-card rounded-xl p-8 text-center space-y-3">
          <p class="text-slate-400">No active exam sessions found.</p>
          <button onclick="openCreateSessionModal()" class="px-4 py-2 bg-indigo-600 rounded-lg text-white font-medium text-sm">Create First Session</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid gap-4">
        ${sessions.map((sess, idx) => `
          <div class="glass-card-glow rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-white font-bold text-base">${sess.title}</span>
                <span class="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/20 text-indigo-300 font-mono">${sess.code}</span>
                <span class="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 capitalize">${sess.mode}</span>
              </div>
              <div class="text-xs text-slate-400 flex items-center gap-4">
                <span>📚 ${sess.topic}</span>
                <span>🔢 ${sess.question_limit} Questions</span>
                <span>⏱️ ${sess.time_limit_minutes} Mins</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="openShareWebsiteModal('${window.location.origin}/session/${sess.code}', '${sess.title}')" class="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                <span>🔗 Share Exam</span>
              </button>
              <button onclick="startRosterMonitoring('${sess.id}')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-xs font-semibold text-white">
                View Roster
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Default monitor the newest session
    if (sessions.length > 0) {
      startRosterMonitoring(sessions[0].id);
    }
  } catch (err) {
    container.innerHTML = `<div class="text-red-400 text-sm">Failed to load sessions: ${err.message}</div>`;
  }
}

function startRosterMonitoring(sessionId) {
  clearInterval(rosterInterval);
  fetchAndRenderRoster(sessionId);
  rosterInterval = setInterval(() => fetchAndRenderRoster(sessionId), 3000);
}

async function fetchAndRenderRoster(sessionId) {
  const container = document.getElementById('admin-roster-container');
  if (!container) return;

  try {
    const res = await fetch(`/api/sessions/${sessionId}/roster`);
    const data = await res.json();
    const roster = data.roster || [];

    if (roster.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-slate-500 text-xs">No students have joined this session yet. Share the session link above.</div>`;
      return;
    }

    container.innerHTML = `
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="border-b border-white/10 text-slate-400">
            <th class="py-2.5">Student</th>
            <th class="py-2.5">Status</th>
            <th class="py-2.5">Answered</th>
            <th class="py-2.5">Score</th>
            <th class="py-2.5">AI Confusion Insight</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          ${roster.map(att => `
            <tr>
              <td class="py-2.5 font-semibold text-white">${att.student_name}</td>
              <td class="py-2.5">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${att.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}">
                  ${att.status}
                </span>
              </td>
              <td class="py-2.5 text-slate-300">${att.answered_count} Qs</td>
              <td class="py-2.5 font-bold ${att.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}">${att.score}%</td>
              <td class="py-2.5 text-slate-400 max-w-[200px] truncate" title="${att.last_misconception}">
                ${att.last_misconception}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<div class="text-red-400 text-xs">Roster error: ${err.message}</div>`;
  }
}

// Create custom question
async function handleCreateCustomQuestion(e) {
  e.preventDefault();
  const topic = document.getElementById('q-topic').value;
  const title = document.getElementById('q-title').value.trim();
  const prompt = document.getElementById('q-prompt').value.trim();
  const correct = document.getElementById('q-correct').value.trim();
  const misconception = document.getElementById('q-misconception').value.trim();

  try {
    const res = await fetch('/api/questions/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        title,
        prompt,
        correct_answer: correct,
        misconception_key: misconception,
        type: 'short_answer'
      })
    });
    if (!res.ok) throw new Error('Failed to create question');
    alert('Question successfully saved to the system bank!');
    document.getElementById('form-create-question').reset();
  } catch (err) {
    alert(err.message);
  }
}

// AI Question Generator trigger
async function handleAIGenerateQuestion() {
  const topic = document.getElementById('q-topic').value;
  try {
    const res = await fetch('/api/questions/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const q = data.question;
    document.getElementById('q-title').value = q.title;
    document.getElementById('q-prompt').value = q.prompt;
    document.getElementById('q-correct').value = q.correct_answer;
    document.getElementById('q-misconception').value = q.misconception_key;
    alert(`✨ AI generated question on ${topic}! Review and click Save.`);
  } catch (err) {
    alert('AI Generation error: ' + err.message);
  }
}

// Modal for creating session
function openCreateSessionModal() {
  const modal = document.createElement('div');
  modal.id = 'create-session-modal';
  modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="glass-card rounded-2xl max-w-lg w-full p-6 space-y-6">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 class="text-xl font-bold text-white">Create Exam or Practice Session</h3>
        <button onclick="document.getElementById('create-session-modal').remove()" class="text-slate-400 hover:text-white text-lg">✕</button>
      </div>

      <div class="space-y-4 text-sm">
        <div>
          <label class="block text-slate-400 text-xs mb-1">Session Title</label>
          <input id="sess-title" type="text" placeholder="e.g. Operating Systems Final Exam" class="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white">
        </div>

        <div>
          <label class="block text-slate-400 text-xs mb-1">Topic</label>
          <select id="sess-topic" class="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white">
            <option>Data Structures & Algorithms</option>
            <option>Operating Systems</option>
            <option>Database Management Systems (DBMS)</option>
            <option>Computer Networks</option>
            <option>OOP & System Design</option>
            <option>Web & Full Stack Systems</option>
            <option>All Topics</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-slate-400 text-xs mb-1">Question Limit</label>
            <select id="sess-limit" class="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white">
              <option value="5">5 Questions</option>
              <option value="10" selected>10 Questions</option>
              <option value="20">20 Questions</option>
              <option value="50">50 Questions</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 text-xs mb-1">Time Limit</label>
            <select id="sess-timer" class="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white">
              <option value="15">15 Minutes</option>
              <option value="30" selected>30 Minutes</option>
              <option value="60">60 Minutes</option>
              <option value="0">Untimed (Practice)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-slate-400 text-xs mb-1">Session Mode</label>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center gap-2 p-3 bg-slate-900/60 border border-white/10 rounded-lg cursor-pointer">
              <input type="radio" name="sess-mode" value="exam" checked>
              <span class="text-xs text-white">Exam (Review at end)</span>
            </label>
            <label class="flex items-center gap-2 p-3 bg-slate-900/60 border border-white/10 rounded-lg cursor-pointer">
              <input type="radio" name="sess-mode" value="practice">
              <span class="text-xs text-white">Practice (Instant AI)</span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button onclick="document.getElementById('create-session-modal').remove()" class="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm">Cancel</button>
        <button onclick="submitNewSession()" class="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-sm">Launch Session</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitNewSession() {
  const title = document.getElementById('sess-title').value.trim();
  const topic = document.getElementById('sess-topic').value;
  const questionLimit = parseInt(document.getElementById('sess-limit').value, 10);
  const timeLimitMinutes = parseInt(document.getElementById('sess-timer').value, 10);
  const mode = document.querySelector('input[name="sess-mode"]:checked').value;

  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, topic, questionLimit, timeLimitMinutes, mode })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    document.getElementById('create-session-modal').remove();
    alert(`Session Created! Shareable Code: ${data.session.code}`);
    loadAdminSessions();
  } catch (err) {
    alert(err.message);
  }
}

// ==========================================
// 3. STUDENT SESSION & PRACTICE ARENA
// ==========================================
function renderSessionView(root, code) {
  if (!currentSession || sessionQuestions.length === 0) {
    root.innerHTML = `<div class="p-12 text-center text-slate-400">Loading session...</div>`;
    return;
  }

  const q = sessionQuestions[activeQuestionIndex];
  const isLast = activeQuestionIndex === sessionQuestions.length - 1;

  // Init timer if exam mode
  if (currentSession.mode === 'exam' && currentSession.time_limit_minutes > 0 && remainingSeconds === 0) {
    remainingSeconds = currentSession.time_limit_minutes * 60;
    startExamTimer();
  }

  root.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-6 py-4">
      <!-- Session Bar -->
      <div class="glass-card rounded-xl p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 bg-indigo-500/20 text-indigo-400 font-mono text-xs font-bold rounded-lg">${currentSession.code}</span>
          <span class="text-white font-bold text-sm hidden sm:inline">${currentSession.title}</span>
          <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">${q.topic}</span>
        </div>
        <div class="flex items-center gap-4">
          ${currentSession.mode === 'exam' && currentSession.time_limit_minutes > 0 ? `
            <div id="exam-timer-display" class="font-mono text-xs font-bold px-3 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <span>⏱️</span>
              <span id="timer-text">--:--</span>
            </div>
          ` : `
            <span class="text-xs text-emerald-400 font-semibold">⚡ Self-Paced Practice</span>
          `}
          <span class="text-xs text-slate-400 font-semibold">Q ${activeQuestionIndex + 1} of ${sessionQuestions.length}</span>
        </div>
      </div>

      <!-- Question Card -->
      <div class="glass-card rounded-2xl p-8 space-y-6">
        <div>
          <span class="text-xs uppercase font-mono tracking-wider text-indigo-400 font-bold">${q.type.replace('_', ' ')}</span>
          <h2 class="text-xl md:text-2xl font-bold text-white mt-1">${q.prompt}</h2>
        </div>

        <!-- Question Body by Type -->
        <div id="question-interaction-container">
          ${renderQuestionInputByType(q)}
        </div>

        <!-- Action Bar -->
        <div class="flex items-center justify-between pt-4 border-t border-white/5">
          <button onclick="prevQuestion()" ${activeQuestionIndex === 0 ? 'disabled class="opacity-30 cursor-not-allowed text-xs text-slate-500"' : 'class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300"'}>
            ← Previous
          </button>
          <div class="flex items-center gap-3">
            <button onclick="submitCurrentAnswer()" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs rounded-lg text-white shadow-lg shadow-indigo-600/30 transition">
              ${currentSession.mode === 'practice' ? 'Check with AI Tutor' : 'Save Answer'}
            </button>
            ${isLast ? `
              <button onclick="finishSession()" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs rounded-lg text-white shadow-lg shadow-emerald-600/30 transition">
                Submit Exam →
              </button>
            ` : `
              <button onclick="nextQuestion()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300">
                Next →
              </button>
            `}
          </div>
        </div>

        <!-- AI Misconception Diagnostic Drawer Container -->
        <div id="ai-diagnostic-drawer" class="hidden mt-6 pt-6 border-t border-white/10"></div>
      </div>
    </div>
  `;

  updateTimerDisplay();
}

function renderQuestionInputByType(q) {
  const savedAnswer = userAnswers[q.id] || '';

  if (q.type === 'mcq') {
    return `
      <div class="space-y-3">
        ${(q.options || []).map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelected = savedAnswer === opt;
          return `
            <div onclick="selectMCQOption('${escapeHtml(opt)}')" class="cursor-pointer p-4 rounded-xl border transition flex items-center gap-4 ${isSelected ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' : 'bg-slate-900/60 border-white/5 hover:border-white/20 text-slate-300'}">
              <span class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}">${letter}</span>
              <span class="text-sm font-medium">${opt}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  if (q.type === 'short_answer') {
    return `
      <div class="space-y-2">
        <label class="block text-xs text-slate-400">Explain your reasoning in your own words:</label>
        <textarea id="short-answer-input" rows="4" oninput="userAnswers['${q.id}'] = this.value" placeholder="Type your conceptual explanation..." class="w-full bg-slate-900/80 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500">${savedAnswer}</textarea>
      </div>
    `;
  }

  if (q.type === 'code') {
    return `
      <div class="space-y-3 font-mono text-xs">
        <div class="flex items-center justify-between text-slate-400">
          <span>Live JavaScript / Code Sandbox</span>
          <button onclick="runCodeInSandbox()" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-sans text-xs">▶ Run Code</button>
        </div>
        <textarea id="code-sandbox-input" rows="7" class="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-emerald-400 focus:outline-none font-mono text-xs leading-relaxed">${savedAnswer || q.code_snippet || '// Write your solution here'}</textarea>
        <div id="code-console-output" class="p-3 bg-black/60 rounded-lg text-slate-400 text-xs border border-white/5">Console output will appear here...</div>
      </div>
    `;
  }
}

function selectMCQOption(opt) {
  const q = sessionQuestions[activeQuestionIndex];
  userAnswers[q.id] = opt;
  // Re-render interaction container
  document.getElementById('question-interaction-container').innerHTML = renderQuestionInputByType(q);
}

function runCodeInSandbox() {
  const code = document.getElementById('code-sandbox-input').value;
  const consoleOut = document.getElementById('code-console-output');
  const q = sessionQuestions[activeQuestionIndex];
  userAnswers[q.id] = code;

  try {
    const logs = [];
    const customConsole = { log: (...args) => logs.push(args.join(' ')) };
    const fn = new Function('console', code);
    fn(customConsole);
    consoleOut.innerHTML = `<span class="text-emerald-400">Execution Success:</span><br>${logs.length > 0 ? logs.join('<br>') : 'Code executed with no output.'}`;
  } catch (err) {
    consoleOut.innerHTML = `<span class="text-rose-400">Runtime Error:</span> ${err.message}`;
  }
}

async function submitCurrentAnswer() {
  const q = sessionQuestions[activeQuestionIndex];
  const ans = userAnswers[q.id];
  if (!ans) return alert('Please select or write an answer before submitting.');

  const drawer = document.getElementById('ai-diagnostic-drawer');
  drawer.classList.remove('hidden');
  drawer.innerHTML = `<div class="p-4 text-indigo-400 text-xs animate-pulse">🤖 AI Diagnostic Engine is analyzing your reasoning...</div>`;

  try {
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attendeeId: currentAttendee ? currentAttendee.id : null,
        questionId: q.id,
        studentAnswer: ans
      })
    });
    const diag = await res.json();

    drawer.innerHTML = `
      <div class="rounded-xl p-5 border ${diag.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-indigo-950/40 border-indigo-500/40'} space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">${diag.isCorrect ? '✅' : '🤖'}</span>
            <span class="font-bold text-sm ${diag.isCorrect ? 'text-emerald-400' : 'text-indigo-400'}">
              ${diag.isCorrect ? 'Mastery Confirmed' : 'AI Misconception Diagnostic'}
            </span>
          </div>
          <span class="text-xs font-mono font-bold px-2 py-0.5 rounded ${diag.isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}">
            Score: ${diag.score}%
          </span>
        </div>

        <div class="text-xs text-slate-300 leading-relaxed">
          <strong class="text-white block mb-1">Why you got confused:</strong>
          <p class="text-slate-300 bg-black/30 p-3 rounded-lg border border-white/5">${diag.whyConfused}</p>
        </div>

        <div class="text-xs text-slate-300 leading-relaxed">
          <strong class="text-indigo-300 block mb-1">Core Computer Science Principle:</strong>
          <p class="text-slate-400 bg-black/30 p-3 rounded-lg border border-white/5">${diag.coreConcept}</p>
        </div>

        <div class="text-xs text-emerald-400 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20">
          <strong>Correct Solution:</strong> ${diag.correctSolution}
        </div>
      </div>
    `;
  } catch (err) {
    drawer.innerHTML = `<div class="text-rose-400 text-xs">Diagnostic error: ${err.message}</div>`;
  }
}

function prevQuestion() {
  if (activeQuestionIndex > 0) {
    activeQuestionIndex--;
    renderSessionView(document.getElementById('app-root'), currentSession.code);
  }
}

function nextQuestion() {
  if (activeQuestionIndex < sessionQuestions.length - 1) {
    activeQuestionIndex++;
    renderSessionView(document.getElementById('app-root'), currentSession.code);
  }
}

async function finishSession() {
  clearInterval(timerInterval);
  const root = document.getElementById('app-root');

  // Submit completion
  if (currentAttendee) {
    try {
      await fetch(`/api/sessions/${currentSession.code}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId: currentAttendee.id })
      });
    } catch (e) {}
  }

  // Calculate score
  let correctCount = 0;
  sessionQuestions.forEach(q => {
    const ans = userAnswers[q.id];
    if (ans && ans.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()) {
      correctCount++;
    }
  });

  const percentage = Math.round((correctCount / sessionQuestions.length) * 100);

  root.innerHTML = `
    <div class="max-w-2xl mx-auto py-12 glass-card-glow rounded-3xl p-8 text-center space-y-6">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-3xl shadow-lg">
        🎉
      </div>
      <div>
        <span class="text-xs uppercase tracking-wider font-mono text-indigo-400 font-bold">Assessment Complete</span>
        <h2 class="text-3xl font-extrabold text-white mt-1">Official Performance Scorecard</h2>
        <p class="text-slate-400 text-sm mt-1">${currentAttendee ? currentAttendee.student_name : 'Student'}</p>
      </div>

      <div class="grid grid-cols-3 gap-4 py-4 border-y border-white/10">
        <div>
          <div class="text-xs text-slate-400">Total Score</div>
          <div class="text-3xl font-black ${percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'}">${percentage}%</div>
        </div>
        <div>
          <div class="text-xs text-slate-400">Solved</div>
          <div class="text-3xl font-black text-white">${correctCount} / ${sessionQuestions.length}</div>
        </div>
        <div>
          <div class="text-xs text-slate-400">Session Mode</div>
          <div class="text-lg font-bold text-indigo-300 capitalize pt-1">${currentSession.mode}</div>
        </div>
      </div>

      <div class="flex justify-center gap-4">
        <button onclick="showView('home')" class="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-sm font-semibold transition">
          Back to Home
        </button>
        <button onclick="showView('practice')" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition">
          Practice More Questions →
        </button>
      </div>
    </div>
  `;
}

// Timer mechanics
function startExamTimer() {
  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      alert('Time has expired! Auto-submitting assessment now.');
      finishSession();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-text');
  if (!el) return;
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ==========================================
// 4. OPEN PRACTICE VIEW
// ==========================================
async function renderOpenPracticeView(root) {
  root.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-8 py-6">
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-extrabold text-white">Open Practice Arena</h1>
        <p class="text-slate-400 text-sm">Select a Computer Science topic and question limit to start instant learning.</p>
      </div>

      <div class="glass-card rounded-2xl p-6 space-y-6">
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-slate-400 text-xs font-semibold mb-2">Subject / Topic</label>
            <select id="open-topic-select" class="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-sm">
              <option>Operating Systems</option>
              <option>Data Structures & Algorithms</option>
              <option>Database Management Systems (DBMS)</option>
              <option>Computer Networks</option>
              <option>OOP & System Design</option>
              <option>Web & Full Stack Systems</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 text-xs font-semibold mb-2">Question Count</label>
            <select id="open-limit-select" class="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-sm">
              <option value="5">5 Questions</option>
              <option value="10" selected>10 Questions</option>
              <option value="20">20 Questions</option>
            </select>
          </div>
        </div>

        <button onclick="startOpenPractice()" class="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 font-bold text-white rounded-xl shadow-lg shadow-indigo-600/30 transition">
          Start Practice Session Now →
        </button>
      </div>
    </div>
  `;
}

async function startOpenPractice() {
  const topic = document.getElementById('open-topic-select').value;
  const limit = parseInt(document.getElementById('open-limit-select').value, 10);

  try {
    const res = await fetch(`/api/questions?topic=${encodeURIComponent(topic)}&limit=${limit}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    currentSession = {
      id: `open-${Date.now()}`,
      code: 'PRACTICE',
      title: `${topic} Practice`,
      topic,
      mode: 'practice',
      time_limit_minutes: 0
    };
    currentAttendee = null;
    sessionQuestions = data.questions;
    activeQuestionIndex = 0;
    userAnswers = {};

    showView('session', { code: 'PRACTICE' });
  } catch (err) {
    alert(err.message);
  }
}

function escapeHtml(str) {
  return (str || '').replace(/"/g, '&quot;');
}

// Share Website Modal & Social Integrations
let cachedNetworkInfo = null;

async function getNetworkInfo() {
  if (cachedNetworkInfo) return cachedNetworkInfo;
  try {
    const res = await fetch('/api/network-info');
    if (res.ok) cachedNetworkInfo = await res.json();
  } catch (err) {}
  return cachedNetworkInfo || { lanIp: '10.133.251.129', port: 3000, lanUrl: 'http://10.133.251.129:3000', localUrl: 'http://localhost:3000' };
}

async function openShareWebsiteModal(customUrl = null, title = 'AI Smart Learning System') {
  const netInfo = await getNetworkInfo();
  
  let lanLink = '';
  let localLink = '';
  
  if (customUrl) {
    try {
      const parsed = new URL(customUrl, window.location.origin);
      lanLink = `${netInfo.lanUrl}${parsed.pathname}${parsed.search}`;
      localLink = `${netInfo.localUrl}${parsed.pathname}${parsed.search}`;
    } catch (e) {
      lanLink = `${netInfo.lanUrl}${customUrl.startsWith('/') ? '' : '/'}${customUrl}`;
      localLink = `${netInfo.localUrl}${customUrl.startsWith('/') ? '' : '/'}${customUrl}`;
    }
  } else {
    lanLink = netInfo.lanUrl;
    localLink = netInfo.localUrl;
  }

  const primaryShareUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? lanLink : (customUrl || window.location.href);
  const encodedUrl = encodeURIComponent(primaryShareUrl);
  const shareText = encodeURIComponent(`Practice Computer Science questions on the AI Smart Learning System: ${primaryShareUrl}`);

  const existing = document.getElementById('share-website-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'share-website-modal';
  modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="glass-card-glow rounded-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-200">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <div class="flex items-center gap-2">
          <span class="text-xl">🔗</span>
          <h3 class="text-lg font-bold text-white">Share ${title}</h3>
        </div>
        <button onclick="document.getElementById('share-website-modal').remove()" class="text-slate-400 hover:text-white text-lg">✕</button>
      </div>

      <div class="space-y-4">
        <p class="text-slate-400 text-xs">
          Anyone with this link can open the website, enter their name, and immediately practice or take computer science exams.
        </p>

        <!-- Shareable Wi-Fi / Mobile Link -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
              <span>📶</span> Shareable Link (Phones / Other PCs on your Wi-Fi):
            </label>
            <span class="text-[10px] text-slate-400">Recommended for sharing</span>
          </div>
          <div class="flex items-center gap-2 bg-black/60 p-2.5 rounded-xl border border-emerald-500/30">
            <input type="text" value="${primaryShareUrl}" id="share-link-input" readonly class="w-full bg-transparent text-emerald-300 font-mono text-xs focus:outline-none select-all px-1">
            <button onclick="copyText('share-link-input', 'copy-btn-text')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shrink-0 transition flex items-center gap-1">
              <span id="copy-btn-text">📋 Copy Link</span>
            </button>
          </div>
        </div>

        <!-- Local PC Link -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-semibold text-indigo-400 flex items-center gap-1.5">
            <span>💻</span> Local PC Link (Only for this computer):
          </label>
          <div class="flex items-center gap-2 bg-black/60 p-2 rounded-xl border border-white/10">
            <input type="text" value="${localLink}" id="share-local-input" readonly class="w-full bg-transparent text-indigo-300 font-mono text-xs focus:outline-none select-all px-1">
            <button onclick="copyText('share-local-input', 'copy-local-btn')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium shrink-0 transition">
              <span id="copy-local-btn">Copy</span>
            </button>
          </div>
        </div>

        <!-- Social Share Quick Actions -->
        <div class="grid grid-cols-2 gap-3 pt-1">
          <a href="https://api.whatsapp.com/send?text=${shareText}" target="_blank" rel="noopener" class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 font-semibold text-xs transition">
            <span>💬 WhatsApp</span>
          </a>
          <a href="mailto:?subject=${encodeURIComponent(title)}&body=${shareText}" class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 font-semibold text-xs transition">
            <span>✉️ Email</span>
          </a>
        </div>

        <!-- QR Code for Mobile Scanning -->
        <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5 flex flex-col items-center gap-2 text-center">
          <span class="text-[11px] text-slate-300 font-medium">📷 Scan with phone camera to open on Wi-Fi:</span>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodedUrl}&bgcolor=0b0f19&color=34d399" alt="QR Code" class="w-32 h-32 rounded-lg border border-emerald-500/30 p-1 bg-slate-950 shadow-md">
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function copyText(inputId, btnId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.select();
  navigator.clipboard.writeText(input.value);
  const btn = document.getElementById(btnId);
  if (btn) {
    const originalText = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => {
      if (btn) btn.textContent = originalText;
    }, 2000);
  }
}

function copyShareLink() {
  copyText('share-link-input', 'copy-btn-text');
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.startsWith('/session/')) {
    const code = path.replace('/session/', '');
    showView('session', { code });
  } else if (path === '/admin') {
    showView('admin');
  } else if (path === '/practice') {
    showView('practice');
  } else {
    showView('home');
  }
});
