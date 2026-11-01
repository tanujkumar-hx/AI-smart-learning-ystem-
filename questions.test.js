const test = require('node:test');
const assert = require('node:assert');
const { resetDb } = require('../src/lib/db');
const {
  seedDatabaseIfEmpty,
  getTopics,
  getQuestionsByTopic,
  getQuestionById,
  getAllQuestions
} = require('../src/lib/questions');

test('Questions Engine seeds and queries questions across 6 core CS topics', () => {
  resetDb();
  seedDatabaseIfEmpty();

  const topics = getTopics();
  assert.strictEqual(topics.length, 6, 'Should have exactly 6 core CS topics');
  assert.ok(topics.includes('Operating Systems'));
  assert.ok(topics.includes('Data Structures & Algorithms'));
  assert.ok(topics.includes('Database Management Systems (DBMS)'));
  assert.ok(topics.includes('Computer Networks'));
  assert.ok(topics.includes('OOP & System Design'));
  assert.ok(topics.includes('Web & Full Stack Systems'));

  const all = getAllQuestions();
  assert.ok(all.length >= 60, `Should seed 60+ questions, got ${all.length}`);

  const osQs = getQuestionsByTopic('Operating Systems', 5);
  assert.strictEqual(osQs.length, 5);
  assert.ok(osQs[0].misconception_key, 'Question should have a misconception key');
  assert.ok(osQs[0].core_concept, 'Question should have a core concept explanation');

  const single = getQuestionById(osQs[0].id);
  assert.strictEqual(single.id, osQs[0].id);
});
