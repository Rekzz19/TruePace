# 🏃‍♂️ TruePace

A Hackathon project - [Live Link](https://truepace-hackathon.vercel.app/)

**The first AI running coach that doesn't just listen—it acts.**

> *Static PDF plans get you injured. TruePace gets you to the finish line.*

TruePace is an **agentic AI running coach** that manages your entire training database. Unlike standard chatbots that just give advice, TruePace has direct access to your schedule. It can autonomously reschedule workouts, adjust intensity based on feedback, and enact injury recovery protocols—just like a real human coach.

---

## ⚡ Key Features

* **🤖 Agentic Chat Interface:** Talk to your coach naturally. Ask to "move tomorrow's run to Friday" or "make this week easier," and the AI executes the database updates instantly.
* **🏥 Injury Response Protocol:** If you log pain after a run, the AI analyzes the severity and automatically modifies your future schedule (e.g., swapping runs for rest or cross-training).
* **📅 Dynamic Scheduling:** Onboarding generates a personalized 2-week plan. As you complete runs, the AI monitors your progress and auto-generates subsequent weeks based on performance data.
* **🧠 Chain of Thought Observability:** Integrated with **Opik** to visualize the AI's decision-making process, tool selection, and latency.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
* **Language:** TypeScript
* **AI Model:** Google **Gemini 2.5 Flash** (via Vercel AI SDK)
* **Database:** PostgreSQL (via Prisma ORM)
* **Auth:** Supabase
* **Observability:** [Opik by Comet](https://comet.com/opik)
* **Styling:** Tailwind CSS
