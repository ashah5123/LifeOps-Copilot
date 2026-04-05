class InterviewPrepService:

    # ------------------------------------------------------------------
    # generate_practice_questions
    # ------------------------------------------------------------------

    def generate_practice_questions(self, job_description: str, role: str) -> list[dict]:
        role_lower = role.lower()

        # Infer technical domain from role/JD keywords
        is_frontend = any(k in role_lower or k in job_description.lower() for k in ("frontend", "front-end", "react", "vue", "angular", "ui"))
        is_backend = any(k in role_lower or k in job_description.lower() for k in ("backend", "back-end", "api", "django", "fastapi", "node", "java", "go"))
        is_data = any(k in role_lower or k in job_description.lower() for k in ("data", "ml", "machine learning", "analyst", "python", "sql"))
        is_fullstack = is_frontend and is_backend

        # Behavioral questions (always included)
        behavioral = [
            {"type": "behavioral", "question": "Tell me about yourself and why you're interested in this role.", "hint": "Use the present–past–future structure."},
            {"type": "behavioral", "question": "Describe a time you faced a significant challenge at work or school and how you overcame it.", "hint": "Use the STAR method."},
            {"type": "behavioral", "question": "Tell me about a time you had to work under tight deadlines.", "hint": "Emphasise prioritisation and outcome."},
            {"type": "behavioral", "question": "Give an example of when you had to collaborate with a difficult team member.", "hint": "Focus on communication and resolution."},
            {"type": "behavioral", "question": "Describe a project you're most proud of. What was your contribution?", "hint": "Quantify impact where possible."},
        ]

        # Role-specific technical questions
        if is_data:
            technical = [
                {"type": "technical", "question": "Explain the difference between supervised and unsupervised learning.", "hint": "Give concrete examples of each."},
                {"type": "technical", "question": "How would you handle a dataset with 40% missing values?", "hint": "Discuss imputation, removal, and model-based approaches."},
                {"type": "technical", "question": "Walk me through how you would design a recommendation system.", "hint": "Cover collaborative filtering, content-based, and hybrid approaches."},
                {"type": "technical", "question": "What's the difference between SQL joins? When would you use each?", "hint": "INNER, LEFT, RIGHT, FULL OUTER — give use cases."},
                {"type": "technical", "question": "Explain overfitting and how to prevent it.", "hint": "Regularisation, cross-validation, dropout."},
            ]
        elif is_frontend:
            technical = [
                {"type": "technical", "question": "Explain the virtual DOM and how React uses it.", "hint": "Discuss diffing and reconciliation."},
                {"type": "technical", "question": "What is the difference between controlled and uncontrolled components?", "hint": "Discuss state management implications."},
                {"type": "technical", "question": "How do you optimise a React application's render performance?", "hint": "useMemo, useCallback, React.memo, lazy loading."},
                {"type": "technical", "question": "Explain CSS specificity and the cascade.", "hint": "Walk through inline > ID > class > element order."},
                {"type": "technical", "question": "What are Web Vitals and why do they matter?", "hint": "LCP, FID/INP, CLS — SEO and UX impact."},
            ]
        elif is_backend:
            technical = [
                {"type": "technical", "question": "How would you design a REST API for a social media platform?", "hint": "Cover resources, endpoints, auth, versioning, pagination."},
                {"type": "technical", "question": "Explain the CAP theorem and how it affects distributed system design.", "hint": "Consistency, availability, partition tolerance trade-offs."},
                {"type": "technical", "question": "What is the N+1 query problem and how do you solve it?", "hint": "Eager loading, DataLoader pattern, JOIN-based solutions."},
                {"type": "technical", "question": "How do you approach database indexing? When would you avoid an index?", "hint": "Cardinality, write overhead, composite indexes."},
                {"type": "technical", "question": "Walk me through how you'd implement authentication and authorisation.", "hint": "JWT vs sessions, RBAC, OAuth2 flows."},
            ]
        else:
            technical = [
                {"type": "technical", "question": "Describe a technical decision you made that had significant impact.", "hint": "Cover trade-offs and outcomes."},
                {"type": "technical", "question": "How do you approach debugging a problem you've never seen before?", "hint": "Describe your systematic process."},
                {"type": "technical", "question": "Explain a complex technical concept to a non-technical stakeholder.", "hint": "Pick something from your experience."},
                {"type": "technical", "question": "How do you stay current with developments in your field?", "hint": "Mention specific resources, communities, or habits."},
                {"type": "technical", "question": "Describe a time you had to learn a new technology quickly.", "hint": "Focus on learning strategy and outcome."},
            ]

        # Role-specific situational questions
        situational = [
            {"type": "situational", "question": f"Where do you see yourself in 3 years relative to this {role} position?", "hint": "Show ambition aligned with the company's growth."},
            {"type": "situational", "question": "How do you handle receiving critical feedback on your work?", "hint": "Give a real example that shows growth mindset."},
            {"type": "situational", "question": "What's your approach when you disagree with a decision made by your manager?", "hint": "Show assertiveness and professionalism."},
            {"type": "situational", "question": "How do you prioritise when multiple stakeholders need something urgently?", "hint": "Discuss frameworks: urgency/impact matrix, communication."},
        ]

        all_questions = behavioral + technical + situational
        for i, q in enumerate(all_questions, start=1):
            q["id"] = i

        return all_questions

    # ------------------------------------------------------------------
    # create_star_responses
    # ------------------------------------------------------------------

    def create_star_responses(self, resume_text: str) -> list[dict]:
        # Extract keywords from resume to personalise STAR templates
        resume_lower = resume_text.lower()

        has_leadership = any(k in resume_lower for k in ("led", "managed", "directed", "coordinated", "mentored"))
        has_engineering = any(k in resume_lower for k in ("built", "developed", "implemented", "designed", "architected"))
        has_impact = any(k in resume_lower for k in ("%", "improved", "reduced", "increased", "saved", "grew"))

        stories = [
            {
                "theme": "Overcoming a Technical Challenge",
                "situation": "Describe the project context and the technical obstacle you encountered.",
                "task": "Explain what you were responsible for delivering despite the challenge.",
                "action": "Walk through the specific steps you took — debugging, research, collaboration, iteration.",
                "result": "Share the measurable outcome: performance gain, bug resolved, delivery on time.",
                "example_prompt": "Think of a time a critical bug appeared close to a deadline.",
            },
            {
                "theme": "Working Under Pressure / Tight Deadlines",
                "situation": "Set the scene: scope of the project, timeline constraints, team size.",
                "task": "Clarify your specific role and what 'success' looked like.",
                "action": "Describe how you prioritised tasks, communicated with stakeholders, and stayed focused.",
                "result": "What was delivered? Was the deadline met? What did you learn?",
                "example_prompt": "Think of a sprint or exam period where you had to deliver under pressure.",
            },
            {
                "theme": "Collaboration & Conflict Resolution",
                "situation": "Describe the team dynamic and the nature of the disagreement.",
                "task": "Explain your role — were you a mediator, a contributor, a team lead?",
                "action": "Detail the specific communication or process changes you introduced.",
                "result": "How did the team dynamic improve? What was the project outcome?",
                "example_prompt": "Think of a group project where teammates had conflicting approaches.",
            },
        ]

        if has_leadership:
            stories.append({
                "theme": "Leadership & Mentorship",
                "situation": "Describe the team or individual you were leading and the goal.",
                "task": "Explain what leadership was required — technical direction, morale, delivery.",
                "action": "Detail how you motivated, guided, or unblocked the team.",
                "result": "What did the team achieve? How did team members grow?",
                "example_prompt": "Think of a time you stepped up to lead when the team needed direction.",
            })

        if has_engineering:
            stories.append({
                "theme": "Designing & Building a System",
                "situation": "Describe the business need or product requirement that prompted the build.",
                "task": "Explain what you were asked to design and the constraints you faced.",
                "action": "Walk through your architectural decisions, trade-offs, and implementation steps.",
                "result": "What was launched? What impact did it have — users, performance, revenue?",
                "example_prompt": "Think of a feature or service you built from scratch.",
            })

        if has_impact:
            stories.append({
                "theme": "Driving Measurable Impact",
                "situation": "Describe the inefficiency, problem, or opportunity you identified.",
                "task": "Explain what you were asked — or chose — to improve.",
                "action": "Detail the changes you made: process, tooling, automation, or strategy.",
                "result": "Quantify the outcome — percentage improvement, time saved, cost reduced.",
                "example_prompt": "Think of a change you made that had a clear before/after metric.",
            })

        # Always add a catch-all failure/learning story
        stories.append({
            "theme": "Learning from Failure",
            "situation": "Describe a project or task that did not go as planned.",
            "task": "Explain what you were responsible for and what the expectations were.",
            "action": "Walk through what went wrong and what you did in response.",
            "result": "What did you learn? How did you apply it to avoid the same mistake?",
            "example_prompt": "Think of a project that missed a goal or required a significant pivot.",
        })

        for i, s in enumerate(stories, start=1):
            s["id"] = i

        return stories

    # ------------------------------------------------------------------
    # research_company
    # ------------------------------------------------------------------

    def research_company(self, company_name: str) -> dict:
        name_lower = company_name.lower()

        # Detect well-known companies for richer mock data
        profiles: dict[str, dict] = {
            "google": {
                "founded": 1998, "size": "100,000+ employees", "hq": "Mountain View, CA",
                "industry": "Technology / Advertising", "public": True,
                "culture_keywords": ["innovation", "data-driven", "20% projects", "psychological safety"],
                "interview_style": "Structured; heavy emphasis on coding, system design, and 'Googleyness'.",
                "recent_focus": ["AI / Gemini", "Cloud growth", "Responsible AI"],
                "values": ["Focus on the user", "Do the right thing", "Think big"],
            },
            "amazon": {
                "founded": 1994, "size": "1.5M+ employees", "hq": "Seattle, WA",
                "industry": "E-commerce / Cloud (AWS)", "public": True,
                "culture_keywords": ["Leadership Principles", "customer obsession", "ownership", "frugality"],
                "interview_style": "Behavioural questions mapped to Leadership Principles. Prepare 2 STAR stories per principle.",
                "recent_focus": ["AWS AI services", "Same-day delivery", "Alexa / devices"],
                "values": ["Customer Obsession", "Bias for Action", "Invent and Simplify"],
            },
            "meta": {
                "founded": 2004, "size": "70,000+ employees", "hq": "Menlo Park, CA",
                "industry": "Social Media / VR", "public": True,
                "culture_keywords": ["move fast", "bold bets", "impact at scale"],
                "interview_style": "Product sense, data analysis, coding, and system design rounds.",
                "recent_focus": ["Llama / open-source AI", "Ray-Ban Meta glasses", "monetisation"],
                "values": ["Move Fast", "Focus on Long-Term Impact", "Be Bold"],
            },
        }

        profile = profiles.get(name_lower)

        if profile:
            return {
                "company": company_name,
                "overview": profile,
                "interview_tips": [
                    f"Study {company_name}'s core values and map your experiences to them.",
                    profile["interview_style"],
                    "Review recent news and product launches in the past 6 months.",
                    "Prepare at least one question per interviewer about their personal experience.",
                ],
                "red_flags_to_ask_about": [
                    "What does day-to-day ownership look like for this role?",
                    "How does the team handle post-mortems and failures?",
                    "What's the on-call or incident response expectation?",
                ],
                "data_source": "mock",
            }

        # Generic profile for unknown companies
        return {
            "company": company_name,
            "overview": {
                "size": "Unknown — research on LinkedIn or Crunchbase",
                "hq": "Check company website",
                "industry": "Review their product/service offering",
                "public": None,
                "culture_keywords": ["research their Glassdoor reviews", "check their engineering blog"],
                "interview_style": "Varies — ask the recruiter for the interview format in advance.",
                "recent_focus": ["Check their blog, press releases, and LinkedIn updates"],
                "values": ["Review their About page and mission statement"],
            },
            "interview_tips": [
                f"Search '{company_name} engineering blog' for technical culture insights.",
                f"Check Glassdoor and Blind for interview experiences at {company_name}.",
                "Ask your recruiter exactly what each round covers.",
                "Research the hiring manager on LinkedIn before the interview.",
            ],
            "red_flags_to_ask_about": [
                "What does success look like in the first 90 days?",
                "How long has this role been open and why?",
                "What's the team's biggest challenge right now?",
            ],
            "data_source": "mock",
        }

    # ------------------------------------------------------------------
    # prepare_questions_to_ask
    # ------------------------------------------------------------------

    def prepare_questions_to_ask(self, company_name: str, role: str) -> list[dict]:
        return [
            {
                "category": "Role & Expectations",
                "questions": [
                    f"What does success look like for a {role} in the first 30, 60, and 90 days?",
                    "What are the biggest challenges the person in this role will face?",
                    "How will my performance be evaluated and how often?",
                ],
            },
            {
                "category": "Team & Culture",
                "questions": [
                    "Can you describe the team I'd be working with day-to-day?",
                    f"What do you enjoy most about working at {company_name}?",
                    "How does the team handle disagreements or technical debates?",
                ],
            },
            {
                "category": "Growth & Career",
                "questions": [
                    "What are the growth opportunities from this role?",
                    "Are there mentorship or learning programmes at the company?",
                    "Where have previous people in this role progressed to?",
                ],
            },
            {
                "category": "Process & Tools",
                "questions": [
                    "What does your development/delivery process look like? Agile, Scrum, Kanban?",
                    "How does the team approach code review and quality?",
                    "What's the on-call or incident response expectation for this role?",
                ],
            },
            {
                "category": "Company Direction",
                "questions": [
                    f"What are {company_name}'s biggest priorities in the next 12 months?",
                    "How is the team/product positioned relative to competitors?",
                    "How has this team been affected by recent industry changes?",
                ],
            },
        ]

    # ------------------------------------------------------------------
    # create_interview_checklist
    # ------------------------------------------------------------------

    def create_interview_checklist(self, interview_type: str) -> list[dict]:
        interview_type_lower = interview_type.lower()

        common = [
            {"category": "Preparation", "items": [
                "Research the company's mission, products, and recent news.",
                "Re-read the job description and align your experience to key requirements.",
                "Prepare 5–7 STAR stories covering: impact, challenge, leadership, failure, collaboration.",
                "Prepare 3–5 thoughtful questions for the interviewer.",
                "Review your own resume — be ready to discuss every line.",
            ]},
        ]

        if "phone" in interview_type_lower:
            specific = [
                {"category": "Phone Screen Setup", "items": [
                    "Find a quiet place with no background noise.",
                    "Charge your phone fully and keep a charger nearby.",
                    "Have water nearby — talking for 30–60 min is tiring.",
                    "Keep your resume and notes visible in front of you.",
                    "Use a headset for hands-free and better audio quality.",
                ]},
                {"category": "During the Call", "items": [
                    "Speak clearly and pause before answering — it's okay to take a moment.",
                    "Smile while speaking — it comes through in your voice.",
                    "Take notes on follow-up questions or names mentioned.",
                    "Ask about next steps and timeline before hanging up.",
                ]},
            ]

        elif "video" in interview_type_lower:
            specific = [
                {"category": "Video Setup", "items": [
                    "Test your camera, microphone, and internet connection 15 min before.",
                    "Ensure your background is clean or use a neutral virtual background.",
                    "Position camera at eye level — avoid looking up or down.",
                    "Dress professionally from the waist up (at minimum).",
                    "Close unnecessary browser tabs and mute notifications.",
                    "Have the meeting link and dial-in backup ready.",
                ]},
                {"category": "During the Interview", "items": [
                    "Look at the camera, not the screen, when speaking.",
                    "Keep a glass of water nearby.",
                    "If there are connection issues, stay calm and suggest a phone call backup.",
                    "Use the chat to share any links or references if needed.",
                ]},
            ]

        elif "technical" in interview_type_lower or "coding" in interview_type_lower:
            specific = [
                {"category": "Technical Prep", "items": [
                    "Practice on LeetCode / HackerRank — focus on arrays, strings, trees, graphs, DP.",
                    "Review Big-O notation and be ready to analyse time and space complexity.",
                    "Practice thinking out loud while solving problems.",
                    "Study system design fundamentals: load balancers, caching, databases, queues.",
                    "Review 2–3 past projects you can discuss in technical depth.",
                ]},
                {"category": "During the Coding Round", "items": [
                    "Clarify the problem before writing any code.",
                    "State your approach and trade-offs before coding.",
                    "Start with a brute-force solution, then optimise.",
                    "Talk through your reasoning continuously.",
                    "Test your solution with edge cases before declaring done.",
                ]},
            ]

        elif "onsite" in interview_type_lower or "on-site" in interview_type_lower:
            specific = [
                {"category": "Logistics", "items": [
                    "Confirm the address, parking, and building access the day before.",
                    "Plan to arrive 10–15 minutes early.",
                    "Bring printed copies of your resume (3–5 copies).",
                    "Bring a notepad and pen.",
                    "Eat a proper meal beforehand — onsite loops can run 4–6 hours.",
                ]},
                {"category": "Multiple Rounds", "items": [
                    "Treat every interviewer as equally important — hiring decisions are collaborative.",
                    "Reset mentally between rounds — each is a fresh start.",
                    "Adapt your communication style (technical vs. non-technical interviewers).",
                    "Ask each interviewer a unique question to show curiosity.",
                    "Stay energised — bring a snack if allowed.",
                ]},
            ]

        else:
            specific = [
                {"category": "General Interview Tips", "items": [
                    "Arrive (or log in) early.",
                    "Bring copies of your resume.",
                    "Stay calm and take your time answering each question.",
                    "Use the STAR method for behavioural questions.",
                    "Ask thoughtful questions at the end.",
                ]},
            ]

        closing = [
            {"category": "After the Interview", "items": [
                "Send a thank-you email within 24 hours referencing a specific topic discussed.",
                "Jot down questions you struggled with for future prep.",
                "Follow up with the recruiter if you haven't heard back within the stated timeline.",
                "Update your application tracker with the interview date and outcome.",
            ]},
        ]

        return common + specific + closing
