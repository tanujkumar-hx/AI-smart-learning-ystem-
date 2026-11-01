const { getDb, saveDb } = require('./db');
const { SEED_QUESTIONS } = require('./seed-questions');

const TOPICS = [
  'Data Structures & Algorithms',
  'Operating Systems',
  'Database Management Systems (DBMS)',
  'Computer Networks',
  'OOP & System Design',
  'Web & Full Stack Systems'
];

function seedDatabaseIfEmpty() {
  const db = getDb();
  if (!db.questions || db.questions.length === 0) {
    db.questions = JSON.parse(JSON.stringify(SEED_QUESTIONS));
    saveDb(db);
  }
}

function getTopics() {
  return TOPICS;
}

function getAllQuestions() {
  seedDatabaseIfEmpty();
  const db = getDb();
  return db.questions;
}

function getQuestionsByTopic(topic, limit = null) {
  seedDatabaseIfEmpty();
  const db = getDb();
  let filtered = db.questions.filter(q => q.topic.toLowerCase() === topic.toLowerCase());
  if (limit && Number.isInteger(limit) && limit > 0) {
    filtered = filtered.slice(0, limit);
  }
  return filtered;
}

function getQuestionById(id) {
  seedDatabaseIfEmpty();
  const db = getDb();
  return db.questions.find(q => q.id === id) || null;
}

function addCustomQuestion(questionData) {
  seedDatabaseIfEmpty();
  const db = getDb();
  const newQuestion = {
    id: questionData.id || `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    topic: questionData.topic,
    type: questionData.type || 'mcq',
    title: questionData.title || 'Custom Question',
    prompt: questionData.prompt,
    options: questionData.options || [],
    correct_answer: questionData.correct_answer,
    misconception_key: questionData.misconception_key || '',
    core_concept: questionData.core_concept || '',
    code_snippet: questionData.code_snippet || ''
  };
  db.questions.push(newQuestion);
  saveDb(db);
  return newQuestion;
}

module.exports = {
  TOPICS,
  seedDatabaseIfEmpty,
  getTopics,
  getAllQuestions,
  getQuestionsByTopic,
  getQuestionById,
  addCustomQuestion
};
