# AI Smart Learning System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, stylish, dual-role AI Smart Learning System featuring an Admin Command Center (for question setup, session link sharing, and live attendance tracking) and a Student Learning Arena (for practicing and taking exams across 6 core computer science topics with an AI Misconception Diagnostic Engine).

**Architecture:** Next.js full-stack application with Tailwind CSS and Lucide React icons on the frontend, API route handlers on the backend, embedded SQLite with WAL mode for zero-friction local persistence, and an AI diagnostic engine that analyzes student confusion with instant offline fallbacks.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide React, SQLite (`better-sqlite3`), and Google Gemini / OpenAI-compatible SDK with offline heuristic fallbacks.

**Spec:** `docs/superpowers/specs/2026-10-25-ai-smart-learning-system-design.md`

## Global Constraints

- Title and branding must strictly read "AI Smart Learning System".
- Modern cyber-luxe dark styling with glassmorphism, responsive across desktop and mobile.
- Zero-friction joining: Students join via shareable link or PIN code by entering their name only.
- Support 6 core Computer Science curricula: Data Structures & Algorithms, Operating Systems, Database Management Systems, Computer Networks, OOP & System Design, and Web Systems.
- AI must diagnose *why the student got confused* (misconception analysis) alongside the correct solution.
- Works offline out-of-the-box with a rich baseline seed of 60+ questions if no external AI API key is supplied.

## Review Focus

1. **Missing or invalid session ID:** When an attendee enters an expired, deleted, or mistyped session PIN/code, the system must display a clean, friendly error card and allow retry rather than crashing or hanging.
2. **Offline AI fallback robustness:** When no AI API key is set or the external service fails, the misconception diagnosis must return a high-quality heuristic analysis from the question's curated misconception key rather than throwing a 500 error.
3. **Timer expiration handling:** In Timed Exam mode, when the countdown reaches 00:00, all current answers must auto-submit immediately, locking inputs and transitioning to the diagnostic scorecard.
4. **Empty or partial short answer submissions:** When a student submits a blank or 1-word answer to a conceptual short-answer prompt, the evaluator must flag it as incomplete rather than failing semantic evaluation.
5. **Real-time attendance concurrency:** When multiple students submit answers or join simultaneously, SQLite WAL mode and safe transactions must prevent database locks or race conditions.

---

### Task 1: Project Scaffolding & Database Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `src/lib/db.ts`
- Create: `src/lib/schema.sql`
- Test: `tests/db.test.ts`

**Interfaces:**
- Produces: `getDb(): Database` returning initialized SQLite connection with tables (`sessions`, `questions`, `attendees`, `submissions`).

- [ ] **Step 1: Write failing database initialization test**
```typescript
import { getDb, resetDb } from '../src/lib/db';

describe('Database Initialization', () => {
  beforeEach(() => resetDb());
  test('creates tables and connects successfully', () => {
    const db = getDb();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map((t: any) => t.name);
    expect(tableNames).toContain('sessions');
    expect(tableNames).toContain('questions');
    expect(tableNames).toContain('attendees');
    expect(tableNames).toContain('submissions');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/db.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Setup Next.js, Tailwind, TypeScript, and SQLite Database layer**
Initialize `package.json`, `tsconfig.json`, `tailwind.config.ts`, and implement `src/lib/db.ts` with SQLite schema for sessions, questions, attendees, and submissions with WAL mode enabled.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/db.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add package.json tsconfig.json tailwind.config.ts src/lib/ tests/
git commit -m "feat: scaffold next.js project and sqlite database layer"
```

---

### Task 2: Computer Science Seed Bank & Question Models

**Files:**
- Create: `src/lib/seed-questions.ts`
- Create: `src/lib/questions.ts`
- Test: `tests/questions.test.ts`

**Interfaces:**
- Consumes: `getDb()` from `src/lib/db.ts`
- Produces: `getQuestionsByTopic(topic: string, limit?: number): Question[]`
- Produces: `seedDatabaseIfEmpty(): void`

- [ ] **Step 1: Write failing test for question seeding and retrieval**
```typescript
import { seedDatabaseIfEmpty, getQuestionsByTopic, getTopics } from '../src/lib/questions';
import { resetDb } from '../src/lib/db';

describe('Questions Engine', () => {
  beforeEach(() => resetDb());
  test('seeds 60+ questions across 6 core CS topics and retrieves by topic', () => {
    seedDatabaseIfEmpty();
    const topics = getTopics();
    expect(topics.length).toBe(6);
    expect(topics).toContain('Operating Systems');
    expect(topics).toContain('Data Structures & Algorithms');
    const osQuestions = getQuestionsByTopic('Operating Systems', 10);
    expect(osQuestions.length).toBeGreaterThanOrEqual(10);
    expect(osQuestions[0].misconception_key).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/questions.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement seed data and query methods**
Populate 60+ curriculum-grade CS questions across DSA, OS, DBMS, Networks, OOP, and Web Systems with rich distractors and misconception guidance in `src/lib/seed-questions.ts`. Implement query helpers in `src/lib/questions.ts`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/questions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/seed-questions.ts src/lib/questions.ts tests/questions.test.ts
git commit -m "feat: add 60+ computer science seed questions across 6 core domains"
```

---

### Task 3: AI Diagnostic Misconception Engine

**Files:**
- Create: `src/lib/ai-diagnostics.ts`
- Create: `src/app/api/diagnose/route.ts`
- Test: `tests/ai-diagnostics.test.ts`

**Interfaces:**
- Consumes: `Question` from `src/lib/questions.ts`
- Produces: `diagnoseConfusion(question: Question, studentAnswer: string): Promise<DiagnosticResult>`
- `DiagnosticResult`: `{ isCorrect: boolean; score: number; whyConfused: string; coreConcept: string; correctSolution: string }`

- [ ] **Step 1: Write failing test for diagnostic evaluation**
```typescript
import { diagnoseConfusion } from '../src/lib/ai-diagnostics';

describe('AI Diagnostic Misconception Engine', () => {
  test('evaluates incorrect attempt and produces whyConfused diagnostic breakdown', async () => {
    const question = {
      id: 'q1',
      title: 'Deadlock Circular Wait',
      type: 'mcq',
      topic: 'Operating Systems',
      prompt: 'Which condition prevents Deadlock by ordering resource requests?',
      correct_answer: 'Linear ordering of resource types',
      misconception_key: 'Students commonly confuse resource ordering with preemption.',
      options: ['Resource ordering', 'Preemption', 'Mutual exclusion', 'Hold and wait']
    };
    const result = await diagnoseConfusion(question, 'Preemption');
    expect(result.isCorrect).toBe(false);
    expect(result.whyConfused.length).toBeGreaterThan(20);
    expect(result.coreConcept).toBeDefined();
    expect(result.correctSolution).toBe('Linear ordering of resource types');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/ai-diagnostics.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement diagnostic engine with offline heuristic fallback**
Implement `diagnoseConfusion` in `src/lib/ai-diagnostics.ts`. If Gemini/OpenAI API key is present, calls the LLM with structured output; otherwise uses the question's misconception heuristics for robust offline diagnosis. Create `/api/diagnose/route.ts`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/ai-diagnostics.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/ai-diagnostics.ts src/app/api/diagnose/ tests/ai-diagnostics.test.ts
git commit -m "feat: implement ai misconception diagnostic engine with offline fallbacks"
```

---

### Task 4: Admin Session Management & Live Attendance API

**Files:**
- Create: `src/lib/sessions.ts`
- Create: `src/app/api/sessions/route.ts`
- Create: `src/app/api/sessions/[code]/route.ts`
- Create: `src/app/api/sessions/[code]/attendees/route.ts`
- Test: `tests/sessions.test.ts`

**Interfaces:**
- Produces: `createSession(data: SessionInput): Session`
- Produces: `joinSession(code: string, studentName: string): Attendee`
- Produces: `recordSubmission(attendeeId: string, questionId: string, answer: string, score: number): void`
- Produces: `getSessionRoster(sessionId: string): AttendeeProgress[]`

- [ ] **Step 1: Write failing test for session creation, student join, and roster tracking**
```typescript
import { createSession, joinSession, recordSubmission, getSessionRoster } from '../src/lib/sessions';
import { resetDb } from '../src/lib/db';

describe('Session & Attendance Management', () => {
  beforeEach(() => resetDb());
  test('creates session with shareable code and tracks live student progress', () => {
    const session = createSession({
      title: 'OS Midterm Assessment',
      topic: 'Operating Systems',
      questionLimit: 10,
      timeLimitMinutes: 30,
      mode: 'exam'
    });
    expect(session.code).toMatch(/^CS-/);

    const attendee = joinSession(session.code, 'Elena Rostova');
    expect(attendee.student_name).toBe('Elena Rostova');

    recordSubmission(attendee.id, 'q-os-1', 'Linear ordering', 100);
    const roster = getSessionRoster(session.id);
    expect(roster.length).toBe(1);
    expect(roster[0].student_name).toBe('Elena Rostova');
    expect(roster[0].answered_count).toBe(1);
    expect(roster[0].current_score).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/sessions.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement session and attendance logic**
Implement CRUD in `src/lib/sessions.ts` and Next.js route handlers under `src/app/api/sessions/`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/sessions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/sessions.ts src/app/api/sessions/ tests/sessions.test.ts
git commit -m "feat: implement session creation, shareable codes, and live attendee roster"
```

---

### Task 5: Admin Command Center UI

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/SessionCreator.tsx`
- Create: `src/components/admin/QuestionStudio.tsx`
- Create: `src/components/admin/LiveRosterMonitor.tsx`
- Test: `tests/admin-ui.test.tsx`

**Interfaces:**
- Consumes: `/api/sessions`, `/api/questions`
- Delivers: Protected Admin portal with session creator (setting question limits 10/20/50/custom, exam timer), shareable link generator with copy button, question authoring/AI generator studio, and live attendee roster.

- [ ] **Step 1: Write test for Admin UI rendering and session creation flow**
```typescript
import { render, screen } from '@testing-library/react';
import AdminPage from '../src/app/admin/page';

describe('Admin Command Center', () => {
  test('renders AI Smart Learning System title, session creator, and attendee roster', () => {
    render(<AdminPage />);
    expect(screen.getByText('AI Smart Learning System')).toBeInTheDocument();
    expect(screen.getByText(/Command & Authority Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Attendees/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/admin-ui.test.tsx`
Expected: FAIL

- [ ] **Step 3: Build Admin Command Center components**
Implement stylish cyber-luxe dark UI with glassmorphic cards, session link creator, question limit controls, and auto-refreshing attendee table.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/admin-ui.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/admin/ src/components/admin/ tests/admin-ui.test.tsx
git commit -m "feat: build stylish admin command center with session creator and live roster"
```

---

### Task 6: Student Learning Arena & Diagnostic Drawer UI

**Files:**
- Create: `src/app/session/[code]/page.tsx`
- Create: `src/app/practice/page.tsx`
- Create: `src/components/student/QuestionCard.tsx`
- Create: `src/components/student/DiagnosticFeedback.tsx`
- Create: `src/components/student/ScorecardReview.tsx`
- Test: `tests/student-arena.test.tsx`

**Interfaces:**
- Consumes: `/api/sessions/[code]`, `/api/diagnose`
- Delivers: Smooth student experience supporting MCQs, short answers, live code runner, instant AI diagnostic drawer for misconceptions, and post-exam scorecards.

- [ ] **Step 1: Write test for Student Practice Arena and Diagnostic drawer**
```typescript
import { render, screen } from '@testing-library/react';
import QuestionCard from '../src/components/student/QuestionCard';

describe('Student Question Card & Diagnostic', () => {
  test('renders MCQ choices and displays AI misconception diagnosis on incorrect answer', async () => {
    const question = {
      id: 'q1',
      title: 'Deadlocks',
      type: 'mcq' as const,
      topic: 'Operating Systems',
      prompt: 'Which condition prevents Deadlock?',
      options: ['Linear ordering', 'Preemption']
    };
    render(<QuestionCard question={question} onAnswer={() => {}} />);
    expect(screen.getByText(question.prompt)).toBeInTheDocument();
    expect(screen.getByText('Linear ordering')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/student-arena.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement Student Learning Arena components**
Build `QuestionCard`, `DiagnosticFeedback` (with "Why you got confused" callout), timer component, and `/session/[code]` student entrance page.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/student-arena.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/session/ src/app/practice/ src/components/student/ tests/student-arena.test.tsx
git commit -m "feat: build student learning arena with ai misconception diagnostic drawer"
```

---

### Task 7: End-to-End Verification & Polish

**Files:**
- Create: `src/app/page.tsx` (Homepage with direct entry for Admin and Students)
- Test: `tests/e2e-flow.test.ts`
- Documentation: `README.md`

**Interfaces:**
- Delivers: Fully integrated experience from homepage, to Admin session creation, to Student test taking with AI diagnostic feedback, to live Admin roster updates.

- [ ] **Step 1: Write complete end-to-end user journey test**
Verify Admin creates session -> Student joins with code -> Student submits answers -> AI produces diagnostic misconception -> Admin roster updates with score.

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/e2e-flow.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement homepage, navigation polish, and verify complete flow**
Create modern landing page in `src/app/page.tsx` linking to Admin Command Center and Student Session joiner. Add comprehensive `README.md` with setup instructions.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/e2e-flow.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/page.tsx tests/e2e-flow.test.ts README.md
git commit -m "feat: complete end-to-end integration and polish for ai smart learning system"
```