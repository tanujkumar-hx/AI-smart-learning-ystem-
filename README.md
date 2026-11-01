# 🚀 AI Smart Learning System

A modern, full-stack, dual-role Computer Science practice, examination, and diagnostic platform powered by an **AI Misconception Diagnostic Engine**. 

Designed for both **educators/administrators** (to create tests, set question limits, distribute shareable links, and track live student attendance) and **students/clients** (to practice and take exams with deep AI feedback that pinpoints *why they got confused* on incorrect attempts).

---

## 🌟 Key Features

### 👑 1. Master Admin Command Center (`/admin`)
- **Authority & Session Management**: Create custom exam or practice sessions with a single click.
- **Configurable Session Controls**:
  - **Question Limits**: Set tests to 5, 10, 20, 50, or custom question counts.
  - **Timer Modes**: Configure timed exams (e.g. 15m, 30m, 60m) or untimed practice sessions.
- **Frictionless Shareable Links**:
  - Every session generates a unique code (e.g. `CS-7K9M`) and direct shareable link (`http://localhost:3000/session/CS-7K9M`).
  - Send the link to any student, client, or cohort—they enter their name and start immediately without complex sign-up friction.
- **Live Attendance & Telemetry Roster**:
  - Auto-refreshing real-time monitor displaying active attendees, question progress, live accuracy scores, and recent AI confusion insights.
- **Question Setup Studio + AI Generator**:
  - Author custom questions across multiple formats (MCQ, Short Answer, Code Sandbox).
  - Tap **"✨ AI Generate Question"** to generate curriculum-grade questions with distractor analysis on demand.

### 🎓 2. Student Learning Arena (`/session/:code` & `/practice`)
- **Multimodal Question Formats**:
  - **Multiple Choice Questions (MCQs)**: Instant selection with distinct feedback.
  - **Conceptual Short Answers**: Type explanations in plain language; evaluated semantically against core principles.
  - **Live Code Sandbox**: Built-in JavaScript editor and runtime console to solve algorithmic problems with instant output.
- **🤖 AI Misconception Diagnostic Engine**:
  - The system never merely outputs "Wrong answer". Instead, it diagnoses the student's exact root misunderstanding:
    - **Why you got confused**: Highlights common traps, misconceptions, and invalid assumptions.
    - **Core Computer Science Principle**: Explains the underlying theory, data structure, or protocol invariant.
    - **Correct Solution**: Provides the step-by-step resolution.
- **Official Performance Scorecard**:
  - Upon exam completion (or timer expiration), students receive a clear score review detailing accuracy, questions solved, and topics mastered.

### 📚 3. Core Computer Science Curricula (60+ Seed Questions)
The platform comes pre-seeded with 60+ curriculum-aligned questions across:
1. **Data Structures & Algorithms**: QuickSort vs MergeSort cache locality, BST degeneracy, Open Addressing hash collisions, DFS cycle back-edges, DP memoization, Dijkstra negative edge constraints, Min-Heaps, Tries, and Dynamic Array amortization.
2. **Operating Systems**: Deadlock Coffman conditions (Circular Wait elimination), Process vs Thread memory layouts, TLB flush overhead, Belady's Anomaly, Semaphore vs Mutex ownership, Virtual Memory Thrashing, Copy-on-Write (COW) `fork()`, Zombie vs Orphan processes, and FCFS scheduling.
3. **Database Management Systems (DBMS)**: ACID Isolation & 2PL, B+ Tree high-fanout leaf links, 2NF partial key dependencies, Index Seek vs Scan, Write-Ahead Logging (WAL) recovery, Phantom vs Non-Repeatable Reads, Clustered Index constraints, SQL NULL 3-valued logic, and BCNF superkey rules.
4. **Computer Networks**: TCP 3-Way Handshake SYN duplicates, DNS UDP efficiency, HTTP/2 binary frame multiplexing, CIDR /26 host calculations, NAT/PAT port translation, TCP Reno AIMD stabilization, ARP MAC discovery, SYN Cookies, and modern TLS 1.3 key exchange.
5. **OOP & System Design**: Liskov Substitution Principle (Square vs Rectangle), Dependency Inversion Principle (DIP), CAP Theorem network partition realities, Consistent Hashing cache remapping, Double-Checked Locking in Singletons, Read Replicas vs Sharding, Factory vs Abstract Factory, Message Queues for backpressure, and Token Bucket rate limiting.
6. **Web & Full-Stack Systems**: Browser CORS enforcement, Stateless JWT revocation challenges, SQL Injection prepared statement compilation, HTTP 401 vs 403, CSRF vs XSS mechanics, React Virtual DOM reconciliation batching, SSR vs CSR hydration, WebSockets vs SSE streaming, and ORM N+1 query batching.

---

## 🛠️ Technology Stack

- **Runtime & Backend**: Node.js HTTP Server (Fast, secure, 0-dependency native architecture).
- **Frontend**: Responsive Single-Page Application (SPA) built with Tailwind CSS, Plus Jakarta Sans, and JetBrains Mono typography.
- **Database**: File-backed JSON/SQLite database layer with atomic write safety in `data/learning_system.json`.
- **Testing**: Node.js built-in test runner (`node --test`) covering units, APIs, and full end-to-end user journeys.

---

## 🏃 Quick Start Guide

### 1. Start the Application
Run the following command in the project root:
```bash
npm start
```
*(Or `node src/server.js`)*

The server will initialize the database and output:
```text
=================================================
🚀 AI Smart Learning System is LIVE!
URL: http://localhost:3000
Admin Center: http://localhost:3000/admin
Practice Arena: http://localhost:3000/practice
=================================================
```

### 2. Using the Platform
- **Landing Page**: Open `http://localhost:3000` to access the hero portal, enter a session code, or jump into open practice.
- **Admin Command Center**: Navigate to `http://localhost:3000/admin` to create a session, set limits, copy shareable links, and monitor live attendees.
- **Taking an Exam**: Open any generated session link (e.g. `http://localhost:3000/session/CS-XXXX`), type your name, and begin answering questions!

### 3. Run the Verification Tests
To run all unit tests, database tests, diagnostic engine tests, and full end-to-end integration tests:
```bash
npm test
```
All 6 test suites will run and verify that all system components pass.

---

## 📁 Project Structure

```text
├── data/
│   └── learning_system.json      # Persistent local database (sessions, questions, attendees, submissions)
├── docs/
│   └── superpowers/
│       ├── specs/                # Formal system design specification
│       └── plans/                # Step-by-step implementation plan
├── src/
│   ├── lib/
│   │   ├── db.js                 # Database connector and persistence layer
│   │   ├── seed-questions.js     # 60+ curriculum CS questions across 6 domains
│   │   ├── questions.js          # Question queries, filtering, and custom authoring
│   │   ├── ai-diagnostics.js     # AI Misconception Diagnostic Engine & Question Generator
│   │   └── sessions.js           # Session creation, codes, attendance roster, and submissions
│   ├── public/
│   │   ├── app.html              # Cyber-luxe responsive SPA shell
│   │   └── app.js                # Frontend routing, interactive test runner, timers, code sandbox, and live roster
│   └── server.js                 # Complete HTTP & REST API server
├── tests/
│   ├── db.test.js                # Database initialization tests
│   ├── questions.test.js         # Topic filtering and question retrieval tests
│   ├── ai-diagnostics.test.js    # AI Misconception diagnostic analysis tests
│   ├── sessions.test.js          # Session code generation and attendee tracking tests
│   ├── server.test.js            # REST API endpoint tests
│   └── e2e-flow.test.js          # Complete end-to-end user journey tests
├── package.json
└── README.md
```

---

## 📄 License
MIT. Built for modern Computer Science education and technical practice.
