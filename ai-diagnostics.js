/**
 * AI Misconception Diagnostic Engine
 * Analyzes why a student got confused or chose the wrong approach,
 * and provides deep conceptual clarity and step-by-step explanations.
 */

async function diagnoseConfusion(question, studentAnswer) {
  const cleanStudent = (studentAnswer || '').trim();
  const cleanCorrect = (question.correct_answer || '').trim();

  // If question type is MCQ, exact match check
  if (question.type === 'mcq') {
    const isExact = cleanStudent.toLowerCase() === cleanCorrect.toLowerCase();
    if (isExact) {
      return {
        isCorrect: true,
        score: 100,
        whyConfused: 'Great job! You avoided the common conceptual traps and directly identified the core principle.',
        coreConcept: question.core_concept || 'Correct understanding applied.',
        correctSolution: question.correct_answer
      };
    }

    // Diagnostic evaluation of the misconception
    let diagnosis = `You selected "${cleanStudent}". `;
    if (question.misconception_key) {
      diagnosis += `${question.misconception_key} `;
    } else {
      diagnosis += `This choice fails because it does not satisfy the requirements of ${question.title}. `;
    }

    return {
      isCorrect: false,
      score: 0,
      whyConfused: diagnosis,
      coreConcept: question.core_concept || 'Review the core fundamentals of this topic.',
      correctSolution: question.correct_answer
    };
  }

  // If question type is short answer or code challenge
  if (question.type === 'short_answer' || question.type === 'code') {
    // If student answer is empty
    if (!cleanStudent || cleanStudent.length < 3) {
      return {
        isCorrect: false,
        score: 0,
        whyConfused: 'Incomplete or empty submission. When faced with this problem, students often freeze because the problem statement seems open-ended.',
        coreConcept: question.core_concept || 'Ensure you express the main algorithmic or architectural principle.',
        correctSolution: question.correct_answer
      };
    }

    // Heuristic keyword matching based on correct answer words
    const correctKeywords = cleanCorrect.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const studentWords = cleanStudent.toLowerCase().split(/\W+/);
    const matchedCount = correctKeywords.filter(k => studentWords.includes(k)).length;
    const matchRatio = correctKeywords.length > 0 ? matchedCount / correctKeywords.length : 0;

    if (matchRatio >= 0.4 || cleanStudent.toLowerCase().includes(cleanCorrect.toLowerCase().slice(0, 15))) {
      return {
        isCorrect: true,
        score: matchRatio >= 0.7 ? 100 : 85,
        whyConfused: 'You accurately captured the core intuition! ' + (question.misconception_key ? `Be sure not to confuse it with related concepts: ${question.misconception_key}` : ''),
        coreConcept: question.core_concept || 'Sound reasoning demonstrated.',
        correctSolution: question.correct_answer
      };
    }

    // Partial or flawed short answer
    return {
      isCorrect: false,
      score: matchRatio > 0.1 ? 40 : 0,
      whyConfused: `Your explanation missed the primary mechanism. ${question.misconception_key || 'You may have focused on high-level symptoms rather than the root cause.'}`,
      coreConcept: question.core_concept || 'Review how this mechanism behaves internally.',
      correctSolution: question.correct_answer
    };
  }

  // Fallback
  return {
    isCorrect: false,
    score: 0,
    whyConfused: question.misconception_key || 'The submitted answer does not match the expected solution.',
    coreConcept: question.core_concept || 'Fundamental CS principle.',
    correctSolution: question.correct_answer
  };
}

/**
 * AI Question Generator Studio Helper
 */
async function generateAIQuestion(topic, type = 'mcq') {
  const timestamp = Date.now();
  const templates = {
    'Operating Systems': {
      title: 'Virtual Memory & Page Invalidation',
      prompt: 'When a page is swapped out to disk, which bit in the Page Table Entry (PTE) is cleared to trigger a Page Fault on next access?',
      options: [
        'The Valid/Present Bit (set to 0)',
        'The Dirty/Modified Bit (set to 0)',
        'The Read/Write Permission Bit',
        'The Reference Bit'
      ],
      correct_answer: 'The Valid/Present Bit (set to 0)',
      misconception_key: 'Students confuse the Dirty Bit (which tracks if page was written to) with the Valid/Present bit (which tells hardware MMU whether the page is currently resident in physical RAM).',
      core_concept: 'The MMU checks the Present bit during virtual address translation. If it is 0, the CPU triggers a Page Fault trap (Interrupt 14 on x86).'
    },
    'Computer Networks': {
      title: 'BGP Path Vector Routing',
      prompt: 'What loop prevention mechanism does the Border Gateway Protocol (BGP) use across Autonomous Systems?',
      options: [
        'Each router inspects the AS-PATH attribute and drops packets containing its own AS number',
        'Split Horizon with Poison Reverse',
        'Dijkstra link state flooding',
        'Counting hops up to infinity at 16'
      ],
      correct_answer: 'Each router inspects the AS-PATH attribute and drops packets containing its own AS number',
      misconception_key: 'Students confuse Distance Vector protocols like RIP (which uses Split Horizon and max hop 15) with BGP (which is a Path Vector protocol tracking entire Autonomous System sequences).',
      core_concept: 'BGP records every Autonomous System (AS) a routing advertisement traversed in the AS_PATH list. If an AS sees its own number in the list, a cycle exists and the route is discarded.'
    },
    'Data Structures & Algorithms': {
      title: 'LRU Cache Design',
      prompt: 'Which combination of data structures achieves both O(1) get and O(1) put operations in a Least Recently Used (LRU) Cache?',
      options: [
        'A Hash Map paired with a Doubly Linked List',
        'A Binary Search Tree paired with an Array',
        'A Min-Heap paired with a Queue',
        'A Trie paired with a Circular Buffer'
      ],
      correct_answer: 'A Hash Map paired with a Doubly Linked List',
      misconception_key: 'Students think a Heap or Queue alone can do it, forgetting that finding and removing an arbitrary element in a queue or heap is O(N), not O(1).',
      core_concept: 'The Hash Map provides O(1) node lookup by key, and the Doubly Linked List allows O(1) removal and splicing of nodes to the head/tail without shifting elements.'
    }
  };

  const defaultTemplate = templates[topic] || {
    title: `${topic} Architectural Question`,
    prompt: `Analyze the core tradeoff when optimizing latency versus throughput in ${topic}.`,
    options: [
      'Batching increases throughput at the cost of higher per-request latency',
      'Lower latency always guarantees maximum bandwidth utilization',
      'Asynchronous queues eliminate all latency overhead',
      'Hardware concurrency doubles memory bandwidth unconditionally'
    ],
    correct_answer: 'Batching increases throughput at the cost of higher per-request latency',
    misconception_key: 'Students often assume latency and throughput can be maximized simultaneously without structural tradeoffs like buffer batching overhead.',
    core_concept: 'Amortizing fixed processing costs across batches increases aggregate throughput, but individual items must wait for buffer fill, raising latency.'
  };

  return {
    id: `ai-gen-${timestamp}`,
    topic,
    type,
    ...defaultTemplate
  };
}

module.exports = {
  diagnoseConfusion,
  generateAIQuestion
};
