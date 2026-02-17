# Gemini Development Workflow
## How Claude (PM) and Gemini (Developer) Work Together

---

## 🎯 Overview

**Claude's Role:** Project Manager / Architect
- Creates detailed task specifications
- Reviews code quality
- Provides feedback and direction
- Maintains project documentation

**Gemini's Role:** Developer / Code Writer
- Implements features based on prompts
- Writes actual code
- Updates status file after each task
- Reports blockers and questions

**Communication:** Via `STATUS.md` file
- Gemini writes updates here
- Claude reads and responds
- Keeps everyone in sync

---

## 📁 File Structure

```
bustadurinn.is/
├── GEMINI_PROMPTS/
│   ├── SPRINT_1/
│   │   ├── TASK-001.md
│   │   ├── TASK-002.md
│   │   └── ...
│   ├── SPRINT_2/
│   └── SPRINT_3/
├── STATUS.md (Gemini updates this)
├── REVIEW_NOTES.md (Claude feedback)
└── [project files...]
```

---

## 🔄 Workflow

### **Step 1: Claude Creates Task Prompt**
Claude writes detailed prompt in `GEMINI_PROMPTS/SPRINT_X/TASK-XXX.md`

### **Step 2: User Gives Prompt to Gemini**
User copies prompt and pastes into Gemini

### **Step 3: Gemini Implements**
Gemini:
1. Reads prompt carefully
2. Writes code
3. Tests locally
4. Updates STATUS.md with:
   - What was completed
   - Files created/modified
   - Any issues/questions
   - Next steps

### **Step 4: Claude Reviews**
Claude reads STATUS.md and:
- Verifies completion
- Reviews code quality (if pasted)
- Provides feedback in REVIEW_NOTES.md
- Approves or requests changes

### **Step 5: Iterate**
Repeat until task is complete

---

## 📋 Status Update Template

**Gemini should update STATUS.md after each task:**

```markdown
## [DATE] - TASK-XXX: [Task Name]

**Status:** ✅ Complete | ⏳ In Progress | ❌ Blocked

**Completed:**
- [x] Created X component
- [x] Added Y functionality
- [x] Tested Z scenario

**Files Created/Modified:**
- `src/app/example/page.tsx` (new)
- `src/components/Example.tsx` (modified)
- `src/services/exampleService.ts` (new)

**Code Summary:**
[Brief description of what was implemented]

**Testing:**
- [x] Compiles without errors
- [x] No TypeScript errors
- [x] Tested basic functionality
- [ ] Needs more edge case testing

**Issues/Questions:**
- None

**Next Steps:**
- Ready for TASK-XXX
```

---

## 🎨 Prompt Template

**Each task prompt should include:**

1. **Context:** What we're building and why
2. **Objective:** Specific goal for this task
3. **Requirements:** Detailed acceptance criteria
4. **Technical Specs:** API, database, components
5. **Implementation Guide:** Step-by-step instructions
6. **Code Examples:** Snippets to guide implementation
7. **Testing:** How to verify it works
8. **Status Update:** What to write in STATUS.md

---

## ✅ Quality Checklist

**Before marking task complete, Gemini should verify:**

- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] ESLint warnings addressed
- [ ] Code follows project conventions
- [ ] Comments added for complex logic
- [ ] STATUS.md updated
- [ ] Ready for next task

---

## 🚀 Getting Started

**First prompt for Gemini:**

```
You are the lead developer for Bustadurinn.is, a summer house booking platform.

Your responsibilities:
1. Implement features based on detailed task prompts
2. Write clean, type-safe TypeScript code
3. Follow Next.js 14 best practices
4. Update STATUS.md after each task
5. Ask questions if anything is unclear

Current tech stack:
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Firebase (Firestore, Auth, Storage)
- Zustand (state management)

Before starting any task:
1. Read the prompt carefully
2. Ask clarifying questions if needed
3. Plan your implementation
4. Write code incrementally
5. Test as you go
6. Update STATUS.md when done

Ready? Say "Ready to start!" and I'll give you the first task.
```

---

## 💬 Communication Examples

### **Gemini Reports Completion:**
```markdown
## Feb 16, 2026 - TASK-001: Project Initialization

**Status:** ✅ Complete

**Completed:**
- [x] Created Next.js 14 project with TypeScript
- [x] Installed all dependencies
- [x] Configured Tailwind CSS
- [x] Set up folder structure
- [x] Created initial layout components

**Files Created:**
- All Next.js scaffolding
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `tailwind.config.ts`
- Package.json with dependencies

**Testing:**
- [x] `npm run dev` works
- [x] Tailwind classes render correctly
- [x] No console errors

**Next Steps:**
Ready for TASK-002 (Firebase Setup)
```

### **Claude Provides Feedback:**
```markdown
## REVIEW: TASK-001

**Status:** ✅ Approved

**Good:**
- Clean project structure
- All dependencies installed correctly
- Tailwind configured properly

**Suggestions:**
- Add `.env.local.example` file
- Update README with setup instructions

**Next Task:**
Proceed with TASK-002: Firebase Setup

**Additional Notes:**
Remember to add `.env.local` to `.gitignore`
```

### **Gemini Reports Blocker:**
```markdown
## Feb 16, 2026 - TASK-005: Authentication

**Status:** ❌ Blocked

**Completed:**
- [x] Set up Firebase Auth
- [x] Created auth service
- [ ] Login form (blocked)

**Issue:**
Need design/UX guidance for login form:
1. Should it be modal or full page?
2. Social login buttons (Google/Facebook)?
3. "Remember me" checkbox?

**Waiting For:**
Claude's decision on UX approach

**Files Modified So Far:**
- `src/services/authService.ts`
- `src/lib/firebase.ts`
```

### **Claude Unblocks:**
```markdown
## RESPONSE: TASK-005

**UX Decisions:**
1. Full page (not modal) - `/login` route
2. Yes to social login (Google only for MVP)
3. Yes to "Remember me" (default checked)

**Design:**
Use simple centered card:
- Logo at top
- Email/password fields
- "Sign in with Google" button
- "Forgot password?" link
- "Remember me" checkbox

**Proceed with:**
Implement login page with these specs
```

---

## 🎯 Success Metrics

**We'll know this workflow is working when:**
- ✅ Tasks completed in < estimated time
- ✅ Code quality is high (minimal rework)
- ✅ Clear communication (no confusion)
- ✅ Steady progress (no long blocks)
- ✅ Both Claude and Gemini stay in sync

---

## 📝 Tips for Gemini

**Do:**
- ✅ Read prompts thoroughly
- ✅ Ask questions before coding
- ✅ Update STATUS.md religiously
- ✅ Test your code before marking complete
- ✅ Follow TypeScript strict mode
- ✅ Use existing patterns from codebase

**Don't:**
- ❌ Skip steps in the prompt
- ❌ Ignore TypeScript errors
- ❌ Forget to update STATUS.md
- ❌ Make architectural decisions without asking
- ❌ Copy-paste code without understanding

---

## 🚀 Ready to Start?

**Next Steps:**
1. Claude creates first task prompt (TASK-001)
2. User gives prompt to Gemini
3. Gemini implements and updates STATUS.md
4. Claude reviews and provides next task
5. Repeat!

Let's build something great! 🎉
