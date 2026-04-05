import type {
  DashboardSummary,
  FeedItem,
  GmailMessage,
  Application,
  CalendarEvent,
  AISuggestedSlot,
  BudgetEntry,
  BudgetSummary,
  Approval,
  CareerSuggestion,
} from "@/types";

export const mockDashboardSummary: DashboardSummary = {
  emailsNeedingReply: 4,
  deadlines: 2,
  tasksToday: 6,
  budgetAlerts: 1,
  careerTracked: 3,
  inboxInsight: "3 emails from professors need replies today",
  careerInsight: "Google internship deadline in 2 days",
  calendarInsight: "Study group at 4 PM, free slot at 6 PM",
  budgetInsight: "Food spending 23% above monthly average",
};

export const mockFeedItems: FeedItem[] = [
  {
    id: "1",
    text: "Reply to Prof. Martinez about research proposal",
    category: "inbox",
    actionLabel: "Draft Reply",
    actionUrl: "/inbox",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    text: "Google SWE Intern application deadline tomorrow",
    category: "career",
    actionLabel: "Review Application",
    actionUrl: "/career",
    timestamp: new Date().toISOString(),
  },
  {
    id: "3",
    text: "Study group meeting in 3 hours",
    category: "calendar",
    actionLabel: "View Details",
    actionUrl: "/calendar",
    timestamp: new Date().toISOString(),
  },
  {
    id: "4",
    text: "Spending spike: $45 on dining out yesterday",
    category: "budget",
    actionLabel: "Review Budget",
    actionUrl: "/budget",
    timestamp: new Date().toISOString(),
  },
  {
    id: "5",
    text: "Scholarship application from Career Services",
    category: "inbox",
    actionLabel: "Read Email",
    actionUrl: "/inbox",
    timestamp: new Date().toISOString(),
  },
];

export const mockGmailMessages: GmailMessage[] = [
  {
    id: "m1",
    threadId: "t1",
    sender: "Prof. Sarah Martinez",
    senderEmail: "s.martinez@university.edu",
    subject: "Re: Research Proposal - Machine Learning Project",
    preview: "Hi, I reviewed your proposal and have some feedback on the methodology section...",
    body: `Hi,

I reviewed your research proposal for the Machine Learning project. Overall, the direction is promising, but I have a few suggestions:

1. The methodology section needs more detail on your data preprocessing pipeline
2. Consider adding a baseline comparison with traditional approaches
3. The timeline looks tight - can you extend the literature review phase by one week?

Please revise and resubmit by Friday. Happy to discuss during office hours.

Best,
Prof. Martinez`,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isUnread: true,
    labels: ["important"],
  },
  {
    id: "m2",
    threadId: "t2",
    sender: "Google Recruiting",
    senderEmail: "recruiting@google.com",
    subject: "Your SWE Intern Application - Next Steps",
    preview: "Thank you for applying to the Software Engineering Intern position. We'd like to schedule...",
    body: `Dear Applicant,

Thank you for your application to the Software Engineering Intern position at Google for Summer 2026.

We were impressed by your background and would like to invite you to the next stage of our interview process. This will consist of:

- A 45-minute technical phone screen
- Two coding interviews (each 45 minutes)

Please use the link below to schedule your phone screen within the next 5 business days.

Best regards,
Google University Recruiting Team`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isUnread: true,
    labels: ["important"],
  },
  {
    id: "m3",
    threadId: "t3",
    sender: "Campus Housing",
    senderEmail: "housing@university.edu",
    subject: "Room Assignment Update - Fall 2026",
    preview: "Your housing assignment for Fall 2026 has been confirmed. Please review the details...",
    body: `Dear Student,

Your housing assignment for Fall 2026 has been confirmed:

Building: West Hall
Room: 412B
Roommate: Assigned (details in portal)
Move-in Date: August 20, 2026

Please log into the housing portal to review and accept your assignment by April 15.

Best,
Office of Campus Housing`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isUnread: false,
    labels: [],
  },
  {
    id: "m4",
    threadId: "t4",
    sender: "Study Group - CS301",
    senderEmail: "cs301-group@groups.university.edu",
    subject: "Meeting today at 4 PM - Algorithms Review",
    preview: "Hey everyone, just confirming our study session today. We'll cover dynamic programming...",
    body: `Hey everyone,

Just confirming our study session today at 4 PM in the library (Room 204).

Agenda:
- Dynamic programming review (chapters 6-7)
- Practice problems from last week's problem set
- Midterm prep strategy

Please bring your laptops and any questions from the homework.

See you there!
- Alex`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    isUnread: false,
    labels: [],
  },
  {
    id: "m5",
    threadId: "t5",
    sender: "Career Services",
    senderEmail: "careers@university.edu",
    subject: "New Scholarship Opportunities - Spring 2026",
    preview: "Several new scholarship opportunities have been posted that match your profile...",
    body: `Dear Student,

Based on your academic profile, we've identified several scholarship opportunities that may interest you:

1. Tech Innovation Scholarship - $5,000 (Deadline: April 20)
2. Women in STEM Award - $3,000 (Deadline: April 25)
3. Community Leadership Grant - $2,500 (Deadline: May 1)

Visit the Career Services portal to apply. Our advisors are available for application review.

Best,
Career Services Office`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isUnread: true,
    labels: [],
  },
];

export const mockApplications: Application[] = [
  {
    id: "a1",
    company: "Google",
    role: "Software Engineering Intern",
    status: "interview",
    appliedDate: "2026-03-15",
    deadline: "2026-04-10",
    notes: "Phone screen scheduled",
    url: "https://careers.google.com",
  },
  {
    id: "a2",
    company: "Microsoft",
    role: "Program Manager Intern",
    status: "applied",
    appliedDate: "2026-03-20",
    deadline: "2026-04-20",
  },
  {
    id: "a3",
    company: "Stripe",
    role: "Software Engineering Intern",
    status: "applied",
    appliedDate: "2026-03-25",
  },
  {
    id: "a4",
    company: "Figma",
    role: "Product Design Intern",
    status: "offer",
    appliedDate: "2026-02-10",
    notes: "Offer received! Decision by April 15",
  },
  {
    id: "a5",
    company: "Meta",
    role: "ML Engineering Intern",
    status: "rejected",
    appliedDate: "2026-02-28",
  },
];

export const mockCareerSuggestions: CareerSuggestion[] = [
  {
    id: "cs1",
    title: "Optimize your Google interview prep",
    description: "Based on your application timeline, focus on system design and behavioral questions this week.",
    actionLabel: "View Plan",
  },
  {
    id: "cs2",
    title: "New matching internship found",
    description: "Amazon SDE Intern role matches 87% of your profile. Application closes in 5 days.",
    actionLabel: "View Role",
  },
  {
    id: "cs3",
    title: "Update your resume",
    description: "Adding your latest ML project could improve match rates by ~15%.",
    actionLabel: "Edit Resume",
  },
];

export const mockCalendarEvents: CalendarEvent[] = [
  { id: "e1", title: "CS301 Lecture", date: "2026-04-07", startTime: "09:00", endTime: "10:30", type: "event", color: "#4DA3FF" },
  { id: "e2", title: "Study Group - Algorithms", date: "2026-04-07", startTime: "16:00", endTime: "18:00", type: "event", color: "#22C55E" },
  { id: "e3", title: "Google Phone Screen", date: "2026-04-08", startTime: "14:00", endTime: "15:00", type: "event", color: "#EF4444" },
  { id: "e4", title: "ML Project Deadline", date: "2026-04-09", startTime: "23:59", endTime: "23:59", type: "deadline", color: "#F59E0B" },
  { id: "e5", title: "Career Fair", date: "2026-04-10", startTime: "10:00", endTime: "15:00", type: "event", color: "#8B5CF6" },
  { id: "e6", title: "Gym Session", date: "2026-04-07", startTime: "07:00", endTime: "08:00", type: "task", color: "#6B7280" },
  { id: "e7", title: "Office Hours - Prof. Martinez", date: "2026-04-08", startTime: "11:00", endTime: "12:00", type: "event", color: "#4DA3FF" },
  { id: "e8", title: "Submit Scholarship App", date: "2026-04-11", startTime: "17:00", endTime: "17:30", type: "task", color: "#FFB020" },
  { id: "e9", title: "Database Systems Lab", date: "2026-04-09", startTime: "13:00", endTime: "15:00", type: "event", color: "#4DA3FF" },
  { id: "e10", title: "Resume Workshop", date: "2026-04-11", startTime: "14:00", endTime: "15:30", type: "event", color: "#22C55E" },
];

export const mockAISuggestedSlots: AISuggestedSlot[] = [
  { id: "s1", title: "Interview Prep Session", suggestedDate: "2026-04-07", suggestedTime: "19:00", reason: "Free evening slot before your Google phone screen" },
  { id: "s2", title: "ML Project Work Block", suggestedDate: "2026-04-08", suggestedTime: "16:00", reason: "3-hour focus block, deadline in 24 hours" },
  { id: "s3", title: "Budget Review", suggestedDate: "2026-04-10", suggestedTime: "18:00", reason: "Weekly spending review, spending spike detected" },
];

export const mockBudgetEntries: BudgetEntry[] = [
  { id: "b1", description: "Campus Dining", amount: 12.50, category: "Food", date: "2026-04-04", type: "expense" },
  { id: "b2", description: "Uber to Career Fair", amount: 8.75, category: "Transport", date: "2026-04-04", type: "expense" },
  { id: "b3", description: "Textbook - Algorithms", amount: 45.00, category: "Education", date: "2026-04-03", type: "expense" },
  { id: "b4", description: "Part-time tutoring", amount: 150.00, category: "Income", date: "2026-04-03", type: "income" },
  { id: "b5", description: "Coffee Shop", amount: 5.50, category: "Food", date: "2026-04-03", type: "expense" },
  { id: "b6", description: "Netflix Subscription", amount: 15.99, category: "Entertainment", date: "2026-04-01", type: "expense" },
  { id: "b7", description: "Grocery Store", amount: 32.40, category: "Food", date: "2026-04-02", type: "expense" },
  { id: "b8", description: "Scholarship Deposit", amount: 500.00, category: "Income", date: "2026-04-01", type: "income" },
];

export const mockBudgetSummary: BudgetSummary = {
  totalIncome: 650.00,
  totalExpenses: 120.14,
  balance: 529.86,
  monthlyBudget: 800.00,
  categories: [
    { category: "Food", amount: 50.40, percentage: 42, color: "#4DA3FF" },
    { category: "Education", amount: 45.00, percentage: 37, color: "#22C55E" },
    { category: "Entertainment", amount: 15.99, percentage: 13, color: "#FFB020" },
    { category: "Transport", amount: 8.75, percentage: 8, color: "#8B5CF6" },
  ],
  alerts: [
    { id: "al1", message: "Spending spike detected: Food spending is 23% above your monthly average", severity: "warning" },
    { id: "al2", message: "You're on track to save $430 this month", severity: "info" },
  ],
};

export const mockApprovals: Approval[] = [
  {
    id: "ap1",
    title: "Send Email Reply",
    description: "Reply to Prof. Martinez about research proposal revisions",
    type: "email_send",
    actionPreview: "Dear Prof. Martinez, Thank you for the feedback. I will revise the methodology section...",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ap2",
    title: "Add Calendar Event",
    description: "Schedule interview prep session",
    type: "calendar_create",
    actionPreview: "Interview Prep Session - Monday 7:00 PM to 9:00 PM",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];
