# Design Document: AI Smart Learning System

**Date:** 2026-10-25  
**Project:** AI Smart Learning System  
**Status:** In Review  

---

## 1. Intent and the "Why"

Computer science students and job-seekers preparing for technical exams frequently face a disconnect: standard practice platforms (like LeetCode or static MCQ quiz sites) either show a binary Pass/Fail or display a raw solution without diagnosing *why* a student stumbled. When students guess wrong or develop misconceptions about complex topics (such as OS deadlocks, database transaction isolation, or algorithmic complexities), traditional tools fail to explain their conceptual gap.

The **AI Smart Learning System** bridges this gap by functioning as an intelligent, stylish practice and examination platform. It gives educators and administrators total authority to launch shareable sessions, configure question limits, and monitor live student attendance, while giving students an interactive tutor that pinpoints their root misconceptions and explains concepts in clear, intuitive terms.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Dual-Role Workflow**:
  - **Admin / Instructor Authority**: Authenticated control room to author custom questions, trigger AI question generation, configure question limits (e.g. 5, 10, 20, 50, or custom), generate shareable session links/PINs, and track live student attendance and completion scores.
  - **Student / Client Arena**: Accessible via direct shareable link without complex installation; allows students to take practice tests or timed exams across Computer Science topics.
- **Multimodal Question Formats**:
  - Multiple Choice Questions (MCQs) with intelligent distractor analysis.
  - Conceptual Short Answers with semantic evaluation.
  - Interactive Code Sandbox challenges for hands-on programming.
- **AI "Misconception Diagnostic" Engine**:
  - When an answer is incorrect or partial, the AI does not just output the right answer; it explains *why the student got confused* (identifying common traps and invalid assumptions) and provides a step-by-step conceptual guide.
- **Rich Computer Science Topic Catalog**:
  - Data Structures & Algorithms (Trees, Graphs, DP, Sorting, Hashing, Big-O)
  - Operating Systems (Processes, Threads, Semaphores, Deadlocks, Paging, Memory Management)
  - Database Management Systems (SQL queries, Normalization 1NF-BCNF, ACID Transactions, Indexing)
  - Computer Networks (TCP/IP 3-Way Handshake, UDP, OSI model, DNS, HTTP/HTTPS, Routing)
  - Object-Oriented Programming & System Design (Polymorphism, SOLID principles, Design Patterns)
  - Web & Full-Stack Systems (REST APIs, Auth, State Management)
- **High-End Stylish User Experience**:
  - Modern cyber-luxe dark interface with crisp typography, glassmorphism cards, glowing status indicators, real-time progress bars, and responsive mobile/desktop layout.
- **Local Self-Contained Deployment**:
  - Works seamlessly with zero external configuration out of the box using embedded local storage (SQLite) and modern web technology.

### Non-Goals
- Building a full university grade-submission portal or external LMS integration (Canvas/Blackboard LTI) in Phase 1.
- Mandatory video camera proctoring or webcam eye-tracking.

### Anti-Goals
- **No Generic "Correct/Incorrect" Dry Walls**: The system must never merely state "Wrong answer" without delivering the diagnostic explanation.
- **No Friction for Students**: Students should never have to complete multi-step email verification just to join a practice link shared by the instructor.
- **No Cluttered External Branding**: The system is branded strictly as **AI Smart Learning System**.

---

## 3. User Roles & Architecture

### User Flow & Permissions

```
+--------------------------------------------------------------+
|                 AI Smart Learning System                     |
+------------------------------+-------------------------------+
                               |
       +-----------------------+-----------------------+
       |                                               |
       v                                               v
[Admin / Instructor Command]               [Student / Client Arena]
- Protected by Admin Passcode              - Direct shareable link / PIN
- Create & manage Question Sets            - Choose Topic / Enter Exam
- Set Question Limits & Timers             - Solve MCQs, Short Answers, Code
- AI Question Generator Studio             - Get AI Diagnostic Misconception breakdowns
- Real-time Attendee Roster                - View personal score & feedback history
- Export Scorecards & Reports
```

### Core Architecture Components
1. **Frontend Client**:
   - Modern React / Next.js single-page application with Tailwind CSS and Lucide icons.
   - Distinct views: `/admin` (Command Center) and `/session/:sessionId` (Student Arena).
   - Reactive state handling for live timer, question stepping, code editor, and diagnostic display.
2. **Backend API**:
   - Node.js / Express or Next.js Route Handlers.
   - REST endpoints for sessions, questions, submissions, and telemetry.
3. **Database Layer**:
   - SQLite via Prisma or better-sqlite3 for zero-setup, fully reliable local persistence.
   - Stores: Admins, Sessions, Questions, Attendees, Submissions, and AI Diagnostic Logs.
4. **AI Intelligence Layer**:
   - Diagnostic prompt engine: receives the question, correct concept, and student attempt; returns structured misconception diagnosis and remedy.
   - Question generation prompt engine: generates curriculum-aligned CS questions per topic, difficulty, and format.
   - Includes robust offline fallback logic with curated CS question banks so the system functions even without an active external API key.

---

## 4. Key Decided Requirements & Builder Calls

| Feature | Decision | Owner / Call |
|---|---|---|
| **Branding** | Strictly "AI Smart Learning System" | Human Partner |
| **Styling** | Cyber-luxe modern dark mode with glassmorphic cards, glowing status badges, and fluid layout | Human Partner |
| **Admin Authority** | Master control to create sessions, set question limits (10, 20, 50, custom), author/generate questions, and inspect live attendance | Human Partner |
| **Student Access** | Instant link / code joining (`/session/:id`) with name input—no onboarding barrier | Human Partner |
| **Question Types** | MCQs, Conceptual Short Answers, Code challenges | Human Partner |
| **AI Feature** | "Why you got confused" diagnostic breakdown explaining root misconceptions + correct conceptual walkthrough | Human Partner |
| **Topics** | DSA, OS, DBMS, Computer Networks, OOP/System Design, Web Development | Human Partner |
| **Feedback Timing** | **Practice Mode:** Immediate per-question diagnostic breakdown. **Timed Exam Mode:** Continuous answering with complete post-exam diagnostic scorecard review. | *Builder Call* |
| **Session Model** | **Admin Sessions:** Pre-configured topic/limit so all cohort students take the assigned assessment. **Open Arena:** Self-paced topic selector for individual practice. | *Builder Call* |
| **Live Attendance Engine** | Fast, reactive telemetry stream with SQLite WAL mode for concurrency, giving the admin real-time attendee presence and score updates. | *Builder Call* |

---

## 5. What is Left to the Builder

- Exact database schema and relationships for Sessions, Questions, Attendees, and Submissions.
- Component breakdown and layout implementation using Tailwind CSS and Lucide icons.
- Baseline question seed bank containing 60+ computer science problems across DSA, OS, DBMS, Networks, OOP, and Web Dev.
- AI prompt engineering with structured JSON schema responses and offline fallback heuristics.
- Sandboxed JavaScript/Python code execution simulator for coding questions.