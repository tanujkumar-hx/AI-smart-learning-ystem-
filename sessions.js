const { getDb, saveDb } = require('./db');
const { getQuestionsByTopic, getAllQuestions } = require('./questions');

function generateSessionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CS-${rand}`;
}

function createSession({ title, topic, questionLimit = 10, timeLimitMinutes = 30, mode = 'practice', customQuestions = null }) {
  const db = getDb();
  const id = `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const code = generateSessionCode();

  // If specific questions provided or selected by topic
  let selectedQuestions = [];
  if (customQuestions && Array.isArray(customQuestions) && customQuestions.length > 0) {
    selectedQuestions = customQuestions;
  } else if (topic && topic !== 'All Topics') {
    selectedQuestions = getQuestionsByTopic(topic, questionLimit);
  } else {
    selectedQuestions = getAllQuestions().slice(0, questionLimit);
  }

  const session = {
    id,
    code,
    title: title || `${topic} Assessment`,
    topic: topic || 'All Topics',
    question_limit: Number(questionLimit),
    time_limit_minutes: Number(timeLimitMinutes),
    mode: mode || 'practice', // 'practice' or 'exam'
    question_ids: selectedQuestions.map(q => q.id),
    created_at: new Date().toISOString()
  };

  db.sessions.push(session);
  saveDb(db);
  return session;
}

function getSessionByCode(code) {
  const db = getDb();
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();
  return db.sessions.find(s => s.code.toUpperCase() === cleanCode) || null;
}

function getSessionById(id) {
  const db = getDb();
  return db.sessions.find(s => s.id === id) || null;
}

function getAllSessions() {
  const db = getDb();
  return db.sessions;
}

function joinSession(code, studentName) {
  const db = getDb();
  const session = getSessionByCode(code);
  if (!session) {
    throw new Error(`Session with code "${code}" not found.`);
  }

  const attendee = {
    id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    session_id: session.id,
    student_name: (studentName || 'Student').trim(),
    status: 'in_progress', // 'in_progress', 'completed'
    score: 0,
    answered_count: 0,
    joined_at: new Date().toISOString(),
    completed_at: null
  };

  db.attendees.push(attendee);
  saveDb(db);
  return attendee;
}

function recordSubmission({ attendeeId, questionId, studentAnswer, isCorrect, whyConfused, score = 0 }) {
  const db = getDb();
  const attendee = db.attendees.find(a => a.id === attendeeId);
  if (!attendee) {
    throw new Error(`Attendee ${attendeeId} not found.`);
  }

  const submission = {
    id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    attendee_id: attendeeId,
    question_id: questionId,
    student_answer: studentAnswer,
    is_correct: Boolean(isCorrect),
    why_confused: whyConfused || '',
    score: Number(score),
    created_at: new Date().toISOString()
  };

  db.submissions.push(submission);

  // Update attendee stats
  const attendeeSubmissions = db.submissions.filter(s => s.attendee_id === attendeeId);
  attendee.answered_count = attendeeSubmissions.length;
  const totalScore = attendeeSubmissions.reduce((sum, s) => sum + s.score, 0);
  attendee.score = Math.round(totalScore / attendeeSubmissions.length);

  saveDb(db);
  return submission;
}

function getSessionRoster(sessionId) {
  const db = getDb();
  const attendees = db.attendees.filter(a => a.session_id === sessionId);

  return attendees.map(att => {
    const subs = db.submissions.filter(s => s.attendee_id === att.id);
    const incorrect = subs.filter(s => !s.is_correct);
    const lastMisconception = incorrect.length > 0 ? incorrect[incorrect.length - 1].why_confused : 'Mastery clean';

    return {
      ...att,
      submissions: subs,
      last_misconception: lastMisconception
    };
  });
}

function getAttendeeById(attendeeId) {
  const db = getDb();
  return db.attendees.find(a => a.id === attendeeId) || null;
}

function completeSessionForAttendee(attendeeId) {
  const db = getDb();
  const attendee = db.attendees.find(a => a.id === attendeeId);
  if (attendee) {
    attendee.status = 'completed';
    attendee.completed_at = new Date().toISOString();
    saveDb(db);
  }
  return attendee;
}

module.exports = {
  createSession,
  getSessionByCode,
  getSessionById,
  getAllSessions,
  joinSession,
  recordSubmission,
  getSessionRoster,
  getAttendeeById,
  completeSessionForAttendee
};
