# FocusFlow AI 🧠⚡

**Live Deployment:** [https://focusflow-ai-beryl.vercel.app/](https://focusflow-ai-beryl.vercel.app/)

Traditional productivity tools and calendars are built on a fundamentally flawed premise: they assume humans are perfect. They require you to manually calculate your own pacing, they crash their analytics when the clock strikes midnight, and if you miss a scheduled session, they mindlessly pile unfinished work into a massive anxiety-inducing backlog. 

**FocusFlow AI is not a planner. It is an autonomous execution engine.**

Instead of forcing you to build a schedule, you simply give FocusFlow your deadlines and your assignments. Our native JavaScript math engines autonomously execute fractional priority slicing, mapping your workload explicitly to your physical sleep cycles to guarantee you remain on a strict trajectory to finish your goals—re-calibrating seamlessly when you inevitably miss a session.

---

## ⚙️ The Core Technical Engines

FocusFlow is powered by three custom, heavily engineered mathematical systems that work natively alongside the **Supabase PostgreSQL** backend and the **Google Gemini Natural Language API**.

### 1. The Planning Engine (`planningEngine.js`)
This engine determines *what* you should be doing and *how long* you should do it.
* **Target Load Pacing**: The engine mathematically calculates the exact number of days remaining until your deadline and divides it against your uncompleted workload. If you skip a day, the engine natively "self-heals", automatically swelling tomorrow's required task limit so you stay on trajectory.
* **Fractional Priority Slicing**: Using a weighting equation (`fraction = topic.priority_score / baselinePrioritySum`), the engine calculates exactly how many minutes you should spend on a single topic. Harder topics naturally claim a larger percentage of your available daily quota to prevent time-blindness and ensure you don't over-invest in easy tasks.
* **Algorithmic Drop Guards**: If procrastination forces the engine to squeeze your workload into impossibly tight limits, it triggers a hard **20-Minute Floor Guard** to prevent useless 3-minute study blocks, actively passing an "Aggressive Time Slicing" UI toast warning to alert you to adjust your load limits.

### 2. The Time Slot Engine (`timeSlotEngine.js`)
This engine manages *when* you execute, aggressively overriding standard 24-hour clock limitations.
* **Circadian Waking Boundaries (Midnight Roll-Over Shift)**: Standard trackers violently reset your data at `12:00 AM`. Our engine natively adds `+24 hours (+1440 mins)` to mathematical block arrays if your inputted Sleep Time crosses midnight. This means a 1:30 AM cram session is securely tracked and bound to your actual physical waking day, protecting your analytics.
* **Dynamic Gap Truncation**: When generating available free time between your fixed physical commitments (like Gym or Classes), the engine natively checks `new Date()`. If you generate a schedule halfway through a free gap, the engine automatically truncates the past time so your schedule starts *exactly now*.

### 3. The Generative Parser Engine (`gemini.js`)
* **Hierarchical Arrays**: We don't use AI to "chat". We strictly utilize Gemini's flash model to ingest massive multi-page exam syllabuses and forcefully output structured JSON arrays, categorizing your subjects by inherent difficulty and estimated completion hours, which are fed directly into the Priority Engine.

---

## 🚶‍♂️ User Walkthrough

Welcome to the FocusFlow ecosystem! Here is how to let the AI take over your week:

**1. Set Your Boundaries (Daily Routine)**
Before the AI can build a schedule, it needs to know your physical limits. Head over to the **Daily Routine** tab. 
* Tell the system when you usually Wake Up and go to Sleep (don't worry if it's past midnight!).
* Input your **Daily Maximum Load** (the absolute maximum amount of hours you are willing to study in a single day so the AI doesn't burn you out).
* Add your fixed daily habits (e.g., Classes from 9 AM to 2 PM, Gym from 5 PM to 6 PM). The AI will mathematically map around these locked blocks.

**2. Feed the Engine (Add Goal)**
Head to the **Add Goal** tab. You can select between an Assignment, an Exam, or a Project.
* **For Assignments**: You will input the exact *Number of Questions*. The AI tracks these discretely, allowing the math engine to divide your remaining questions exactly by your remaining days.
* **For Exams**: You will paste your literal *Syllabus Content*. The Gemini AI parser will take over, breaking the massive text down into hierarchical study topics so you don't have to manually type out chapters!

**3. Execute (Generate Today's Plan)**
Go back to the Dashboard and hit **Generate Today's Plan**. The AI engines will instantly calculate your required load for the day, divide the minutes fractionally based on difficulty, find the gaps in your routine, and map out your blocks. 
* As you complete tasks, you will log how difficult they were. Your 30-Day Progress Analytics chart will dynamically render a heat map of your focus!

---

## 🚀 The Future Roadmap

FocusFlow AI is an evolving architecture. Here is what we are building next:
1. **Frictionless Onboarding**: Implementing a seamless startup pop-up that captures a new user's routine preferences and boundaries immediately upon their first login, removing the need to manually configure the Daily Routine tab.
2. **Email Interventions**: Utilizing Supabase Edge Functions to run weekly background chron-jobs that scrape your session history and email you an automated Behavioral Analysis report of your performance.
3. **Deep Focus Lock Mode**: A native dashboard feature that turns your screen fully black with a minimalist timer during an active block, locking away other tabs until the fractional task time is completed.
4. **Native Mobile Application**: Migrating the React components to React Native / Swift to create an iOS app capable of hitting your phone with aggressive Push Notifications (*"You have 40 minutes remaining to complete 2 Assignment Questions. Start now."*).
5. **LMS Sync Integrations**: Building secure OAuth syncs with university systems like Canvas and Blackboard to scrape syllabus deadlines autonomously without requiring any manual typing from the user.

---
*Built to end task paralysis. FocusFlow AI decides what's next, so you can just focus on doing it.*
