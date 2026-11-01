const test = require('node:test');
const assert = require('node:assert');
const { diagnoseConfusion } = require('../src/lib/ai-diagnostics');

test('AI Diagnostic Misconception Engine evaluates incorrect attempt with detailed explanation', async () => {
  const question = {
    id: 'test-q1',
    topic: 'Operating Systems',
    type: 'mcq',
    title: 'Deadlock Circular Wait',
    prompt: 'Which condition prevents Deadlock by strictly ordering resource requests?',
    options: [
      'Impose a strict global linear ordering of resource types',
      'Allow preemption of currently held resources'
    ],
    correct_answer: 'Impose a strict global linear ordering of resource types',
    misconception_key: 'Students commonly confuse resource ordering with preemption.',
    core_concept: 'Numbering resources strictly prevents directed cycles in the allocation graph.'
  };

  // Test incorrect answer
  const wrongResult = await diagnoseConfusion(question, 'Allow preemption of currently held resources');
  assert.strictEqual(wrongResult.isCorrect, false);
  assert.strictEqual(wrongResult.score, 0);
  assert.ok(wrongResult.whyConfused.length > 20, 'Why confused explanation should be detailed');
  assert.ok(wrongResult.coreConcept.length > 10, 'Core concept should be provided');
  assert.strictEqual(wrongResult.correctSolution, question.correct_answer);

  // Test correct answer
  const correctResult = await diagnoseConfusion(question, 'Impose a strict global linear ordering of resource types');
  assert.strictEqual(correctResult.isCorrect, true);
  assert.strictEqual(correctResult.score, 100);
});
