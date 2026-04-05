"use client";

import { useState, useRef, useMemo, useEffect, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  MapPinIcon,
  BuildingOffice2Icon,
  ClockIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useAppStore } from "@/lib/store";
import {
  searchJobs as searchJobsApi,
  listApplications,
  createApplication,
  applyFromJobListing,
  optimizeResumeForAts,
} from "@/lib/api";
import { htmlToPlainText } from "@/lib/html";
import { mockCareerSuggestions } from "@/lib/mock-data";
import type { Application, CareerSuggestion } from "@/types";

function normalizeJobKey(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function mapApiApplication(row: Record<string, unknown>): Application {
  const statusRaw = String(row.status ?? "applied").toLowerCase();
  const statusMap: Record<string, Application["status"]> = {
    saved: "saved",
    applied: "applied",
    screening: "screening",
    interviewing: "interview",
    interview: "interview",
    offer: "offer",
    rejected: "rejected",
    accepted: "accepted",
  };
  const status = statusMap[statusRaw] ?? "applied";
  const desc = row.job_description ? String(row.job_description) : "";
  return {
    id: String(row.id),
    company: String(row.company ?? ""),
    role: String(row.role ?? ""),
    status,
    appliedDate: String(row.applied_date ?? "").slice(0, 10) || "—",
    deadline: row.deadline ? String(row.deadline).slice(0, 10) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    jobDescription: desc ? desc.slice(0, 4000) : undefined,
    jobId: row.job_id != null && String(row.job_id).length > 0 ? String(row.job_id) : undefined,
    url: row.job_url
      ? String(row.job_url)
      : row.apply_link
        ? String(row.apply_link)
        : row.url
          ? String(row.url)
          : row.link
            ? String(row.link)
            : undefined,
  };
}

/* ── Types ──────────────────────────────────────────────────── */

interface JobResult {
  id: string;
  company: string;
  role: string;
  location: string;
  salaryRange: string;
  posted: string;
  match: number;
  /** ATS / board name from API (JSearch, Remotive, etc.) */
  source: string;
  description: string;
  requirements: string[];
  qualifications: string[];
  companyInfo: string;
  /** Employer apply URL from JSearch / scrapers (Workday, Greenhouse, etc.) */
  applyLink?: string;
}

/* ── Job database by category ───────────────────────────────── */

const sources: string[] = ["LinkedIn", "Glassdoor", "Google Jobs", "Indeed"];

function pickSource(index: number): string {
  return sources[index % sources.length];
}

const dataJobs: JobResult[] = [
  {
    id: "ds1",
    company: "Google DeepMind",
    role: "Data Scientist Intern",
    location: "Mountain View, CA",
    salaryRange: "$55 - $70/hr",
    posted: "1 day ago",
    match: 96,
    source: pickSource(0),
    description:
      "Join the DeepMind team to analyze large-scale datasets and build predictive models that power next-generation AI products. You will collaborate with research scientists and engineers to extract insights from petabyte-scale data, design experiments, and present findings to leadership.",
    requirements: [
      "Pursuing MS/PhD in Statistics, Computer Science, or related field",
      "Strong proficiency in Python, R, and SQL",
      "Experience with TensorFlow, PyTorch, or JAX",
      "Familiarity with cloud platforms (GCP preferred)",
      "Published research in ML/AI is a plus",
    ],
    qualifications: [
      "GPA of 3.5 or higher",
      "Experience with A/B testing and causal inference",
      "Strong communication and data storytelling skills",
    ],
    companyInfo:
      "Google DeepMind is an AI research lab focused on building safe, beneficial AI. Based in Mountain View, CA, the team has published over 1,000 papers and develops cutting-edge models used across Google products.",
  },
  {
    id: "ds2",
    company: "Netflix",
    role: "Data Scientist - Personalization",
    location: "Los Gatos, CA",
    salaryRange: "$60 - $75/hr",
    posted: "3 days ago",
    match: 92,
    source: pickSource(1),
    description:
      "Work on the algorithms that power recommendations for 250M+ subscribers worldwide. You will develop statistical models, run experiments at scale, and collaborate with product teams to improve content discovery and member retention.",
    requirements: [
      "MS/PhD in Statistics, ML, or quantitative field",
      "Expert-level SQL and Python (pandas, scikit-learn)",
      "Experience with recommendation systems or NLP",
      "Ability to design and analyze large-scale A/B tests",
    ],
    qualifications: [
      "2+ years industry or research experience",
      "Familiarity with Spark, Presto, or similar big data tools",
      "Strong written and verbal communication",
    ],
    companyInfo:
      "Netflix is the world's leading entertainment streaming service with 250M+ paid memberships in over 190 countries. The Data Science team drives core personalization, content strategy, and experimentation.",
  },
  {
    id: "ds3",
    company: "Spotify",
    role: "Machine Learning Engineer - Audio",
    location: "New York, NY (Hybrid)",
    salaryRange: "$50 - $65/hr",
    posted: "2 days ago",
    match: 89,
    source: pickSource(2),
    description:
      "Build ML models that understand audio content at scale. From automatic playlist generation to podcast recommendations, you will own end-to-end ML pipelines that serve hundreds of millions of daily active users.",
    requirements: [
      "BS/MS in CS, EE, or related field",
      "Strong foundation in deep learning and signal processing",
      "Production ML experience (model training, serving, monitoring)",
      "Python, PyTorch or TensorFlow",
    ],
    qualifications: [
      "Experience with audio/speech ML models",
      "Familiarity with Kubernetes and MLflow",
      "Published work in audio ML or information retrieval",
    ],
    companyInfo:
      "Spotify is the world's most popular audio streaming platform with 600M+ users. The ML team builds the intelligence behind Discover Weekly, Release Radar, and more.",
  },
  {
    id: "ds4",
    company: "Two Sigma",
    role: "Quantitative Research Intern",
    location: "New York, NY",
    salaryRange: "$75 - $90/hr",
    posted: "5 days ago",
    match: 85,
    source: pickSource(3),
    description:
      "Apply advanced statistical methods and machine learning to financial data. You will research alpha signals, build predictive models, and work alongside portfolio managers to develop systematic trading strategies.",
    requirements: [
      "Pursuing PhD in Math, Statistics, Physics, or CS",
      "Strong mathematical foundations (probability, optimization)",
      "Proficiency in Python or C++",
      "Experience with time series analysis",
    ],
    qualifications: [
      "Competition math or programming background",
      "Publications in quantitative research",
      "Prior quant finance experience is a plus",
    ],
    companyInfo:
      "Two Sigma is a technology-driven investment firm that applies rigorous analysis, math, and computer science to financial markets. Managing over $60B in assets.",
  },
  {
    id: "ds5",
    company: "Meta",
    role: "Data Scientist - Integrity",
    location: "Menlo Park, CA",
    salaryRange: "$55 - $70/hr",
    posted: "4 days ago",
    match: 88,
    source: pickSource(0),
    description:
      "Use data science to protect billions of users from harmful content. Design detection models, analyze abuse patterns, and measure the effectiveness of safety interventions across Facebook and Instagram.",
    requirements: [
      "MS in Statistics, Data Science, or related field",
      "4+ years SQL experience, 2+ years Python",
      "Experience with classification and anomaly detection",
      "Strong experiment design skills",
    ],
    qualifications: [
      "Experience with trust & safety or content moderation",
      "Familiarity with graph analytics",
      "Ability to communicate complex findings to non-technical stakeholders",
    ],
    companyInfo:
      "Meta builds technologies that help people connect. The Integrity team is responsible for keeping the platform safe for over 3 billion users worldwide.",
  },
  {
    id: "ds6",
    company: "Apple",
    role: "ML Research Intern - Siri",
    location: "Cupertino, CA",
    salaryRange: "$60 - $80/hr",
    posted: "1 week ago",
    match: 83,
    source: pickSource(1),
    description:
      "Advance the state of the art in natural language understanding for Siri. Research and implement novel NLU models, evaluate on real user queries, and collaborate with engineering teams to ship improvements to hundreds of millions of devices.",
    requirements: [
      "Pursuing PhD in NLP, ML, or Computational Linguistics",
      "Track record of published NLP research",
      "Experience with transformer architectures",
      "Strong Python and PyTorch skills",
    ],
    qualifications: [
      "Experience with on-device ML or model compression",
      "Knowledge of multilingual NLP",
      "Familiarity with speech recognition pipelines",
    ],
    companyInfo:
      "Apple creates products that enrich people's lives. Siri processes billions of requests per week, and the ML team drives continuous improvements in understanding and response quality.",
  },
  {
    id: "ds7",
    company: "Airbnb",
    role: "Data Scientist - Search Ranking",
    location: "San Francisco, CA",
    salaryRange: "$52 - $68/hr",
    posted: "3 days ago",
    match: 87,
    source: pickSource(2),
    description:
      "Optimize the search and ranking algorithms that connect millions of guests with the perfect listing. Apply causal inference, ML modeling, and experimentation to improve search relevance, conversion, and host earnings.",
    requirements: [
      "MS in Statistics, Economics, or quantitative field",
      "Expert SQL and Python",
      "Experience with ranking models and learning-to-rank frameworks",
      "Strong causal inference background",
    ],
    qualifications: [
      "Experience with marketplace or two-sided platforms",
      "Familiarity with Spark and Airflow",
      "Published work or patents in search/ranking",
    ],
    companyInfo:
      "Airbnb is a global travel platform with millions of listings in 220+ countries. The Search team ensures guests find the right stay at the right price.",
  },
  {
    id: "ds8",
    company: "OpenAI",
    role: "Research Scientist Intern",
    location: "San Francisco, CA",
    salaryRange: "$70 - $90/hr",
    posted: "2 days ago",
    match: 94,
    source: pickSource(3),
    description:
      "Contribute to frontier AI research. You will work on alignment, scaling, or capabilities research alongside world-class scientists. Projects range from RLHF improvements to novel architectures for reasoning and planning.",
    requirements: [
      "Pursuing PhD in ML, AI, or related field",
      "Strong publication record at top ML venues (NeurIPS, ICML, ICLR)",
      "Deep expertise in deep learning frameworks",
      "Experience with large-scale distributed training",
    ],
    qualifications: [
      "Experience with RLHF or constitutional AI methods",
      "Familiarity with transformer scaling laws",
      "Strong mathematical reasoning skills",
    ],
    companyInfo:
      "OpenAI's mission is to ensure that artificial general intelligence benefits all of humanity. The research team has produced GPT-4, DALL-E, and other groundbreaking models.",
  },
];

const sweJobs: JobResult[] = [
  {
    id: "swe1",
    company: "Google",
    role: "Software Engineering Intern",
    location: "Mountain View, CA",
    salaryRange: "$55 - $68/hr",
    posted: "2 days ago",
    match: 95,
    source: pickSource(0),
    description:
      "Design, develop, and test large-scale distributed systems as part of Google's core infrastructure team. You will write production code in C++ or Java, participate in code reviews, and collaborate with a team of world-class engineers on projects that impact billions of users.",
    requirements: [
      "Pursuing BS/MS in Computer Science or related field",
      "Strong foundation in data structures and algorithms",
      "Proficiency in one or more: C++, Java, Python, Go",
      "Experience with version control (Git)",
    ],
    qualifications: [
      "GPA of 3.5 or higher",
      "Prior internship or significant project experience",
      "Familiarity with distributed systems concepts",
    ],
    companyInfo:
      "Google is a multinational technology company specializing in search, cloud computing, and AI. With over 180,000 employees, Google offers one of the most sought-after internship programs in the industry.",
  },
  {
    id: "swe2",
    company: "Amazon",
    role: "SDE Intern",
    location: "Seattle, WA",
    salaryRange: "$50 - $62/hr",
    posted: "3 days ago",
    match: 91,
    source: pickSource(1),
    description:
      "Build and operate high-performance, fault-tolerant services at massive scale for one of Amazon's customer-facing or backend teams. You will own features end-to-end, from design through deployment, and work in a fast-paced environment that values ownership and customer obsession.",
    requirements: [
      "Pursuing BS/MS in CS, CE, or related field",
      "Knowledge of algorithms, data structures, and complexity analysis",
      "Experience in at least one OOP language (Java, C++, Python)",
      "Familiarity with databases and SQL",
    ],
    qualifications: [
      "Experience with AWS services",
      "Understanding of CI/CD pipelines",
      "Previous software engineering internship experience",
    ],
    companyInfo:
      "Amazon is the world's largest e-commerce and cloud computing company. Amazon Web Services (AWS) powers millions of businesses worldwide, and the SDE intern program is a direct pipeline to full-time roles.",
  },
  {
    id: "swe3",
    company: "Stripe",
    role: "Backend Engineer Intern",
    location: "San Francisco, CA (Remote)",
    salaryRange: "$52 - $65/hr",
    posted: "5 days ago",
    match: 88,
    source: pickSource(2),
    description:
      "Help build the economic infrastructure of the internet. You will work on Stripe's payments platform, designing APIs used by millions of businesses, optimizing transaction processing, and ensuring five-nines reliability for critical financial systems.",
    requirements: [
      "Pursuing BS/MS in Computer Science",
      "Strong knowledge of backend systems and API design",
      "Proficiency in Ruby, Python, Java, or Go",
      "Understanding of relational databases and distributed systems",
    ],
    qualifications: [
      "Experience building production web services",
      "Familiarity with payment systems or fintech",
      "Strong debugging and problem-solving skills",
    ],
    companyInfo:
      "Stripe is a financial infrastructure platform for the internet. Millions of companies use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.",
  },
  {
    id: "swe4",
    company: "Microsoft",
    role: "Software Engineer Intern",
    location: "Redmond, WA",
    salaryRange: "$48 - $60/hr",
    posted: "1 day ago",
    match: 93,
    source: pickSource(3),
    description:
      "Work on products used by over a billion people. From Azure cloud services to Microsoft 365, you will contribute to meaningful features, collaborate with experienced mentors, and experience a supportive internship program with community events and hackathons.",
    requirements: [
      "Pursuing BS/MS in CS, CE, or related technical field",
      "Proficiency in C#, C++, Java, or TypeScript",
      "Strong understanding of algorithms and systems design",
      "Enrolled full-time in a university program",
    ],
    qualifications: [
      "Experience with cloud computing (Azure preferred)",
      "Open-source contributions or personal projects",
      "Strong communication and teamwork skills",
    ],
    companyInfo:
      "Microsoft empowers every person and organization to achieve more. With products spanning productivity, gaming, cloud, and AI, Microsoft offers interns the chance to make impact at global scale.",
  },
  {
    id: "swe5",
    company: "Apple",
    role: "iOS Engineering Intern",
    location: "Cupertino, CA",
    salaryRange: "$53 - $66/hr",
    posted: "1 week ago",
    match: 84,
    source: pickSource(0),
    description:
      "Build the next generation of iOS features used by over a billion Apple devices. You will work closely with the UIKit and SwiftUI teams, prototype new interactions, optimize performance, and ship code to hundreds of millions of users.",
    requirements: [
      "Pursuing BS/MS in Computer Science or related field",
      "Proficiency in Swift and/or Objective-C",
      "Experience building iOS applications",
      "Understanding of mobile app architecture patterns (MVC, MVVM)",
    ],
    qualifications: [
      "Published apps on the App Store",
      "Experience with Core Data, Combine, or SwiftUI",
      "Strong attention to detail and design sensibility",
    ],
    companyInfo:
      "Apple designs products that enrich people's lives. With a focus on innovation, privacy, and user experience, Apple's engineering teams create software and hardware used by billions worldwide.",
  },
  {
    id: "swe6",
    company: "Coinbase",
    role: "Full Stack Engineer Intern",
    location: "Remote (US)",
    salaryRange: "$50 - $63/hr",
    posted: "4 days ago",
    match: 82,
    source: pickSource(1),
    description:
      "Build the future of decentralized finance. You will work across the stack (React, Node.js, Go) to develop trading features, wallet integrations, and compliance tools used by 100M+ verified users on the Coinbase platform.",
    requirements: [
      "Pursuing BS/MS in CS or related field",
      "Proficiency in JavaScript/TypeScript and React",
      "Backend experience in Node.js, Go, or Python",
      "Familiarity with RESTful APIs and databases",
    ],
    qualifications: [
      "Interest in crypto, blockchain, or DeFi",
      "Experience with testing frameworks (Jest, Cypress)",
      "Understanding of security best practices",
    ],
    companyInfo:
      "Coinbase is the leading cryptocurrency exchange in the US, serving over 100 million verified users. The engineering team builds secure, scalable financial infrastructure for the crypto economy.",
  },
  {
    id: "swe7",
    company: "Databricks",
    role: "Software Engineer Intern - Platform",
    location: "San Francisco, CA",
    salaryRange: "$55 - $72/hr",
    posted: "6 days ago",
    match: 86,
    source: pickSource(2),
    description:
      "Work on the Lakehouse platform used by thousands of enterprises for data engineering and AI. You will build distributed systems, optimize query engines, and contribute to open-source projects like Apache Spark and Delta Lake.",
    requirements: [
      "Pursuing BS/MS/PhD in Computer Science",
      "Strong systems programming skills (Java, Scala, or C++)",
      "Understanding of distributed computing concepts",
      "Experience with databases or data processing frameworks",
    ],
    qualifications: [
      "Contributions to Apache Spark or related projects",
      "Experience with Kubernetes or cloud infrastructure",
      "Familiarity with data lake architectures",
    ],
    companyInfo:
      "Databricks is the Data and AI company, founded by the creators of Apache Spark. The Lakehouse platform unifies data engineering, science, and analytics for over 10,000 organizations worldwide.",
  },
  {
    id: "swe8",
    company: "Figma",
    role: "Software Engineer Intern",
    location: "San Francisco, CA (Hybrid)",
    salaryRange: "$50 - $63/hr",
    posted: "3 days ago",
    match: 90,
    source: pickSource(3),
    description:
      "Help build the collaborative design platform used by teams at every major tech company. You will work on the web application (TypeScript, C++/WebAssembly), improve real-time collaboration features, and optimize rendering performance for complex design files.",
    requirements: [
      "Pursuing BS/MS in Computer Science",
      "Proficiency in TypeScript or C++",
      "Strong understanding of web technologies (HTML, CSS, WebGL)",
      "Passion for developer tools and creative software",
    ],
    qualifications: [
      "Experience with WebAssembly or graphics programming",
      "Familiarity with CRDTs or operational transform",
      "Strong design sensibility and attention to detail",
    ],
    companyInfo:
      "Figma is the leading collaborative design platform where teams create, prototype, and iterate together in real time. Used by millions of designers and developers at companies like Google, Microsoft, and Airbnb.",
  },
];

const designJobs: JobResult[] = [
  {
    id: "des1",
    company: "Figma",
    role: "Product Design Intern",
    location: "San Francisco, CA",
    salaryRange: "$45 - $58/hr",
    posted: "2 days ago",
    match: 94,
    source: pickSource(0),
    description:
      "Design features for the world's most popular collaborative design tool. You will work end-to-end on product features, from user research and wireframes to high-fidelity prototypes and pixel-perfect implementation handoff.",
    requirements: [
      "Pursuing degree in Design, HCI, or related field",
      "Strong portfolio demonstrating product design skills",
      "Proficiency in Figma (obviously!)",
      "Experience with user research methodologies",
    ],
    qualifications: [
      "Prior design internship experience",
      "Understanding of design systems",
      "Basic prototyping and interaction design skills",
    ],
    companyInfo:
      "Figma is the leading collaborative design platform. The design team practices what they preach, using Figma to design Figma and shape the future of creative tools.",
  },
  {
    id: "des2",
    company: "Airbnb",
    role: "Product Manager Intern",
    location: "San Francisco, CA",
    salaryRange: "$50 - $65/hr",
    posted: "4 days ago",
    match: 89,
    source: pickSource(1),
    description:
      "Drive product strategy for a feature area that impacts millions of travelers and hosts. You will define product requirements, work with design and engineering to ship features, and use data to measure impact and iterate.",
    requirements: [
      "Pursuing MBA or MS in a technical or business field",
      "Strong analytical and problem-solving skills",
      "Excellent written and verbal communication",
      "Experience with product development lifecycle",
    ],
    qualifications: [
      "Prior PM internship or product experience",
      "Technical background (CS minor or bootcamp)",
      "Familiarity with A/B testing and data analysis",
    ],
    companyInfo:
      "Airbnb is a global travel platform with millions of listings in 220+ countries. PMs at Airbnb own their product areas end-to-end and drive both strategy and execution.",
  },
  {
    id: "des3",
    company: "Apple",
    role: "UX Design Intern",
    location: "Cupertino, CA",
    salaryRange: "$48 - $60/hr",
    posted: "1 week ago",
    match: 86,
    source: pickSource(2),
    description:
      "Design intuitive user experiences for Apple's ecosystem of products. Collaborate with cross-functional teams to create seamless interactions across iOS, macOS, and new platforms, while upholding Apple's legendary design standards.",
    requirements: [
      "Pursuing degree in Design, HCI, or related field",
      "Portfolio demonstrating strong UX process and visual design",
      "Proficiency in design and prototyping tools",
      "Strong understanding of accessibility and inclusive design",
    ],
    qualifications: [
      "Experience with motion design or micro-interactions",
      "Understanding of platform design guidelines (HIG)",
      "Curiosity about emerging technologies (AR/VR, AI)",
    ],
    companyInfo:
      "Apple's design team sets the standard for user experience across the tech industry. Working at the intersection of hardware and software, Apple designers shape products used by billions.",
  },
  {
    id: "des4",
    company: "Notion",
    role: "Product Designer",
    location: "New York, NY (Hybrid)",
    salaryRange: "$46 - $58/hr",
    posted: "3 days ago",
    match: 91,
    source: pickSource(3),
    description:
      "Shape the future of productivity tools used by millions. You will design features that make complex workflows simple and delightful, working closely with engineering and the founding team in a fast-paced, design-driven culture.",
    requirements: [
      "Pursuing or recently completed degree in Design or HCI",
      "Strong systems thinking and interaction design skills",
      "Experience designing for complex information architectures",
      "Proficiency in Figma and prototyping tools",
    ],
    qualifications: [
      "Experience with design systems at scale",
      "Interest in productivity, note-taking, or collaboration tools",
      "Understanding of frontend development (HTML/CSS/JS)",
    ],
    companyInfo:
      "Notion is the all-in-one workspace for notes, docs, wikis, and project management. Used by teams at startups and Fortune 500 companies alike, Notion is redefining how people work.",
  },
  {
    id: "des5",
    company: "Spotify",
    role: "Product Design Intern",
    location: "Stockholm, Sweden (Remote OK)",
    salaryRange: "$44 - $56/hr",
    posted: "5 days ago",
    match: 84,
    source: pickSource(0),
    description:
      "Design experiences that delight hundreds of millions of music lovers. From playlist creation to artist discovery, you will work on features that shape how the world listens to music and podcasts.",
    requirements: [
      "Pursuing degree in Design, HCI, or related field",
      "Strong visual and interaction design skills",
      "Portfolio showing end-to-end design process",
      "Experience with user testing and iteration",
    ],
    qualifications: [
      "Passion for music and audio",
      "Experience with mobile-first design",
      "Understanding of accessibility standards",
    ],
    companyInfo:
      "Spotify is the world's most popular audio streaming platform with 600M+ users and 200M+ subscribers. The design team crafts experiences across mobile, desktop, web, and connected devices.",
  },
  {
    id: "des6",
    company: "Google",
    role: "UX Research Intern",
    location: "Mountain View, CA",
    salaryRange: "$48 - $62/hr",
    posted: "6 days ago",
    match: 82,
    source: pickSource(1),
    description:
      "Conduct user research that informs product decisions across Google. You will plan and execute studies, synthesize findings, and present actionable insights to cross-functional teams building products for billions.",
    requirements: [
      "Pursuing MS/PhD in HCI, Psychology, or related field",
      "Experience with qualitative and quantitative research methods",
      "Strong analytical and presentation skills",
      "Proficiency with research tools (UserTesting, Qualtrics)",
    ],
    qualifications: [
      "Published research in HCI or UX",
      "Experience with survey design and statistical analysis",
      "Familiarity with design thinking methodologies",
    ],
    companyInfo:
      "Google's UX Research team drives product decisions across Search, Maps, Android, and more. The team conducts research at a scale that impacts billions of users worldwide.",
  },
  {
    id: "des7",
    company: "Slack",
    role: "Product Manager Intern",
    location: "San Francisco, CA",
    salaryRange: "$50 - $63/hr",
    posted: "2 days ago",
    match: 88,
    source: pickSource(2),
    description:
      "Define and ship features for the communication platform used by millions of teams. You will identify user pain points, write product specs, collaborate with engineers, and use data to drive decisions in a fast-paced environment.",
    requirements: [
      "Pursuing MBA or technical graduate degree",
      "Strong analytical skills and data fluency",
      "Excellent communication and stakeholder management",
      "Understanding of enterprise SaaS products",
    ],
    qualifications: [
      "Prior PM or product internship experience",
      "Technical skills (SQL, basic programming)",
      "Experience with agile development processes",
    ],
    companyInfo:
      "Slack is where work happens for millions of people worldwide. Now part of Salesforce, Slack's PM team shapes the future of workplace communication and collaboration.",
  },
  {
    id: "des8",
    company: "Meta",
    role: "Product Design Intern",
    location: "Menlo Park, CA",
    salaryRange: "$47 - $60/hr",
    posted: "4 days ago",
    match: 85,
    source: pickSource(3),
    description:
      "Design social experiences used by billions of people across Facebook, Instagram, and WhatsApp. You will tackle complex interaction design challenges, prototype new concepts, and collaborate with the largest design team in tech.",
    requirements: [
      "Pursuing degree in Design, HCI, or related field",
      "Portfolio demonstrating strong product design process",
      "Proficiency in Figma and prototyping tools",
      "Understanding of mobile and responsive design patterns",
    ],
    qualifications: [
      "Experience designing for social platforms",
      "Familiarity with AR/VR or spatial design",
      "Strong systems thinking and design system experience",
    ],
    companyInfo:
      "Meta builds technologies that help people connect. With apps serving over 3 billion people, Meta's design team works on some of the most complex and impactful design challenges in the world.",
  },
];

const mixedJobs: JobResult[] = [
  sweJobs[0],
  dataJobs[0],
  designJobs[0],
  sweJobs[1],
  dataJobs[1],
  designJobs[1],
  sweJobs[2],
  dataJobs[2],
];

/* ── Helper: pick jobs based on query ───────────────────────── */

function getJobsForQuery(query: string): JobResult[] {
  const q = query.toLowerCase();
  if (q.includes("data") || q.includes("scientist") || q.includes("ml") || q.includes("machine learning") || q.includes("ai")) {
    return dataJobs;
  }
  if (q.includes("software") || q.includes("engineer") || q.includes("swe") || q.includes("sde") || q.includes("developer") || q.includes("backend") || q.includes("frontend") || q.includes("full stack")) {
    return sweJobs;
  }
  if (q.includes("design") || q.includes("product") || q.includes("ux") || q.includes("pm") || q.includes("manager")) {
    return designJobs;
  }
  return mixedJobs;
}

/* ── Static helpers ─────────────────────────────────────────── */

const statusVariant: Record<
  Application["status"],
  "info" | "warning" | "success" | "error"
> = {
  saved: "info",
  applied: "info",
  screening: "warning",
  interview: "warning",
  offer: "success",
  rejected: "error",
  accepted: "success",
};

const statusLabel: Record<Application["status"], string> = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  accepted: "Accepted",
};

const PIPELINE_HIDE_APPLY: Application["status"][] = [
  "applied",
  "screening",
  "interview",
  "offer",
  "accepted",
];

/** Below this match %, we run ATS optimization (Gemini/Vertex) before apply. */
const ATS_BOOST_THRESHOLD = 30;

const sourceBadgeColor: Record<string, string> = {
  LinkedIn: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200",
  Glassdoor: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-200",
  "Google Jobs": "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200",
  Indeed: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-200",
  Remotive: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  jsearch: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
};

/* ── Animations ─────────────────────────────────────────────── */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

/* ── Component ──────────────────────────────────────────────── */

export default function CareerPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppCompany, setNewAppCompany] = useState("");
  const [newAppRole, setNewAppRole] = useState("");
  const [newAppStatus, setNewAppStatus] = useState<Application["status"]>("applied");
  const [newAppDeadline, setNewAppDeadline] = useState("");
  const [newAppNotes, setNewAppNotes] = useState("");
  const [filter, setFilter] = useState<Application["status"] | "all">("all");

  // Job search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [jobResults, setJobResults] = useState<JobResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Expanded job card (for "View Details")
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Auto-apply modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyTarget, setApplyTarget] = useState<JobResult | null>(null);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyReviewStep, setApplyReviewStep] = useState<0 | 1>(1);
  const [applyNeedsAtsBoost, setApplyNeedsAtsBoost] = useState(false);
  const [atsOptimizing, setAtsOptimizing] = useState(false);
  const [atsActivityLog, setAtsActivityLog] = useState<string[]>([]);
  const [optimizedResumeDraft, setOptimizedResumeDraft] = useState("");
  const [atsChangeSummary, setAtsChangeSummary] = useState("");
  const [estimatedAtsPercent, setEstimatedAtsPercent] = useState<number | null>(null);

  // Resume upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store
  const addToast = useAppStore((s) => s.addToast);
  const resumeFile = useAppStore((s) => s.resumeFile);
  const setResumeFile = useAppStore((s) => s.setResumeFile);
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    setAppsLoading(true);
    listApplications()
      .then((rows) => {
        setApplications(rows.map((r) => mapApiApplication(r as Record<string, unknown>)));
      })
      .catch(() => {
        setApplications([]);
        addToast({ message: "Could not load applications from the server.", type: "error" });
      })
      .finally(() => setAppsLoading(false));
  }, [addToast]);

  /* ── Derived ──────────────────────────────────────── */

  const filteredApps =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);

  const statusCounts = {
    all: applications.length,
    applied: applications.filter((a) => a.status === "applied").length,
    screening: applications.filter((a) => a.status === "screening").length,
    interview: applications.filter((a) => a.status === "interview").length,
    offer: applications.filter((a) => a.status === "offer").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const jobApplicationKeys = useMemo(() => {
    const ids = new Set<string>();
    const pairs = new Set<string>();
    for (const a of applications) {
      if (!PIPELINE_HIDE_APPLY.includes(a.status)) continue;
      if (a.jobId) ids.add(a.jobId);
      pairs.add(`${normalizeJobKey(a.company)}|${normalizeJobKey(a.role)}`);
    }
    return { ids, pairs };
  }, [applications]);

  function isJobAppliedInPipeline(job: JobResult) {
    return (
      jobApplicationKeys.ids.has(job.id) ||
      jobApplicationKeys.pairs.has(`${normalizeJobKey(job.company)}|${normalizeJobKey(job.role)}`)
    );
  }

  /* ── Handlers ─────────────────────────────────────── */

  async function handleSearch(overrideQuery?: string) {
    const q = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    if (!q) {
      addToast({ message: "Enter a job keyword to search.", type: "info" });
      return;
    }
    if (overrideQuery !== undefined) {
      setSearchQuery(q);
    }
    setSearchLoading(true);
    setShowResults(false);
    setExpandedJobId(null);
    try {
      // Call real backend API which fetches from Remotive + fallback
      const results = await searchJobsApi(q);
      // Map backend response to JobResult shape
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: JobResult[] = results.map((j: Record<string, unknown>, idx: number) => {
        const smin = j.salary_min as number | null | undefined;
        const smax = j.salary_max as number | null | undefined;
        const scur = (j.salary_currency as string) || "USD";
        let salaryRange = "Not disclosed";
        if (smin != null || smax != null) {
          salaryRange = `${smin ?? "?"}–${smax ?? "?"} ${scur}`.trim();
        } else if (typeof j.salary === "string") {
          salaryRange = j.salary;
        }
        const skills = (j.skills_required as string[]) || [];
        const posted =
          String(j.posted_date || j.postedDate || j.job_posted_at_datetime_utc || "").slice(0, 10) ||
          new Date().toISOString().slice(0, 10);
        const applyLink = String(j.apply_link || j.job_apply_link || j.url || "").trim();
        return {
          id: String(j.id || `job-${idx}`),
          company: String(j.company || j.employer_name || "Unknown"),
          role: String(j.title || j.job_title || "Unknown Role"),
          location: String(j.location || j.job_city || "Remote"),
          salaryRange,
          posted,
          match: typeof j.match_score === "number" ? j.match_score : 70 + Math.floor(Math.random() * 25),
          source: String(j.source || pickSource(idx)),
          description: htmlToPlainText(String(j.description || j.job_description || "")),
          requirements: skills.length ? skills : ["See job posting for details"],
          qualifications: ["Bachelor's degree or equivalent experience"],
          companyInfo: `${String(j.company || "")} — ${String(j.job_type || "Technology")}`,
          applyLink: applyLink || undefined,
        };
      });
      setJobResults(mapped);
      if (mapped.length === 0) {
        addToast({ message: "No jobs returned for that search. Try different keywords.", type: "info" });
      }
    } catch {
      setJobResults([]);
      addToast({ message: "Job search failed. Check that the API is running and RapidAPI key is set.", type: "error" });
    }
    setShowResults(true);
    setSearchLoading(false);
  }

  function toggleJobDetails(jobId: string) {
    setExpandedJobId((prev) => (prev === jobId ? null : jobId));
  }

  function handleCareerSuggestionAction(suggestion: CareerSuggestion) {
    document.getElementById("career-job-search")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (suggestion.actionLabel === "View Plan") {
      addToast({
        message: "Use Job Search above to find roles; Add Application tracks them on your board.",
        type: "info",
      });
      return;
    }
    if (suggestion.actionLabel === "View Role") {
      void handleSearch("Amazon software development engineer intern");
      addToast({ message: "Searching for roles matching that suggestion…", type: "info" });
      return;
    }
    if (suggestion.actionLabel === "Edit Resume") {
      fileInputRef.current?.click();
      addToast({ message: "Choose a PDF, DOCX, or TXT resume file.", type: "info" });
    }
  }

  async function runAtsOptimization(job: JobResult, baseResume: string) {
    setAtsOptimizing(true);
    const lines: string[] = [];
    const stamp = () =>
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const log = (msg: string) => {
      lines.push(`${stamp()} — ${msg}`);
      setAtsActivityLog([...lines]);
    };
    log("Reading job description and your resume");
    await new Promise((r) => setTimeout(r, 400));
    log("Extracting keywords for ATS alignment");
    await new Promise((r) => setTimeout(r, 350));
    try {
      log("Calling AI to tailor your resume to this posting…");
      const res = await optimizeResumeForAts({
        job_description: htmlToPlainText(job.description),
        resume_text: baseResume,
        company: job.company,
        role: job.role,
      });
      for (const step of res.transparency_steps ?? []) {
        log(String(step));
      }
      setOptimizedResumeDraft((res.optimized_resume_text || baseResume).trim() || baseResume);
      setEstimatedAtsPercent(
        typeof res.estimated_ats_match_percent === "number" ? res.estimated_ats_match_percent : 90,
      );
      setAtsChangeSummary(res.change_summary || "");
      log("Optimization complete — review the draft, edit if needed, then submit");
    } catch {
      log("AI service unavailable — edit your resume in the box below, then submit");
      setOptimizedResumeDraft(baseResume);
      setEstimatedAtsPercent(null);
      setAtsChangeSummary("");
    } finally {
      setAtsOptimizing(false);
      setApplyReviewStep(1);
    }
  }

  function handleApplyNow(job: JobResult) {
    if (!resumeFile) {
      addToast({ message: "Upload your resume first", type: "error" });
      return;
    }
    const base = resumeFile.text ?? "";
    const needBoost = job.match < ATS_BOOST_THRESHOLD;
    setApplyTarget(job);
    setApplySuccess(false);
    setApplySubmitting(false);
    setApplyNeedsAtsBoost(needBoost);
    setAtsChangeSummary("");
    setEstimatedAtsPercent(needBoost ? job.match : null);
    setOptimizedResumeDraft(base);
    setAtsActivityLog([]);
    if (needBoost) {
      setApplyReviewStep(0);
      setApplyModalOpen(true);
      void runAtsOptimization(job, base);
    } else {
      setApplyReviewStep(1);
      setApplyModalOpen(true);
    }
  }

  async function handleSubmitApplication() {
    if (!applyTarget) return;
    setApplySubmitting(true);
    const resumeText =
      applyNeedsAtsBoost && optimizedResumeDraft.trim()
        ? optimizedResumeDraft.trim()
        : resumeFile?.text ?? "";
    const coverLetter =
      applyNeedsAtsBoost && estimatedAtsPercent != null
        ? `ATS-optimized package. Estimated match after rewrite: ${estimatedAtsPercent}%. ${atsChangeSummary}`.slice(
            0,
            4000,
          )
        : "";
    try {
      try {
        await applyFromJobListing(applyTarget.id, {
          resume_text: resumeText,
          cover_letter: coverLetter,
          notes: applyNeedsAtsBoost
            ? "Submitted from LifeOps — low match triggered ATS resume boost + user review"
            : "Submitted from LifeOps career search",
        });
      } catch {
        await createApplication({
          company: applyTarget.company,
          role: applyTarget.role,
          status: "applied",
          applied_date: new Date().toISOString().slice(0, 10),
          job_url: applyTarget.applyLink ?? "",
          job_description: htmlToPlainText(applyTarget.description).slice(0, 2000),
          notes: applyNeedsAtsBoost
            ? "Manual apply — ATS-boosted resume text included in sync"
            : "Manual / mock job listing",
          job_id: applyTarget.id,
        });
      }
      const rows = await listApplications();
      if (rows.length) {
        setApplications(rows.map((r) => mapApiApplication(r as Record<string, unknown>)));
      }
      setApplySuccess(true);
    } catch {
      addToast({ message: "Could not submit application to the server", type: "error" });
    } finally {
      setApplySubmitting(false);
    }
  }

  function closeApplyModal() {
    setApplyModalOpen(false);
    if (applySuccess && applyTarget) {
      addToast({
        message: `Application submitted to ${applyTarget.company} for ${applyTarget.role}!`,
        type: "success",
      });
    }
    setApplyTarget(null);
    setApplySuccess(false);
    setApplyReviewStep(1);
    setApplyNeedsAtsBoost(false);
    setAtsOptimizing(false);
    setAtsActivityLog([]);
    setOptimizedResumeDraft("");
    setAtsChangeSummary("");
    setEstimatedAtsPercent(null);
  }

  function handleResumeUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext ?? "")) {
      addToast({
        message: "Please upload a PDF, DOCX, or TXT file.",
        type: "error",
      });
      return;
    }

    if (ext === "txt") {
      const reader = new FileReader();
      reader.onload = () => {
        setResumeFile({
          name: file.name,
          text: reader.result as string,
          uploadedAt: new Date().toISOString(),
        });
        addToast({ message: "Resume uploaded!", type: "success" });
      };
      reader.readAsText(file);
    } else {
      setResumeFile({
        name: file.name,
        text: "",
        uploadedAt: new Date().toISOString(),
      });
      addToast({ message: "Resume uploaded!", type: "success" });
    }

    e.target.value = "";
  }

  function matchColor(match: number) {
    if (match >= 90) return "text-green-600";
    if (match >= 80) return "text-amber-600";
    return "text-text-secondary";
  }

  function matchBg(match: number) {
    if (match >= 90) return "bg-green-50";
    if (match >= 80) return "bg-amber-50";
    return "bg-gray-50";
  }

  /* ── Render ─────────────────────────────────────────── */

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        {/* ── Header ──────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Career Tracker
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {applications.length} applications tracked
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            icon={<PlusIcon className="w-4 h-4" />}
          >
            Add Application
          </Button>
        </div>

        {/* ── Job Search Section ──────────────────── */}
        <div id="career-job-search" className="mb-6 scroll-mt-24">
        <Card padding="md">
          <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <MagnifyingGlassIcon className="w-4 h-4 text-primary" />
            Job Search by Interest
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder='e.g., "data scientist", "software engineer", "product design"'
              className="flex-1 px-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button
              onClick={() => void handleSearch()}
              loading={searchLoading}
              icon={
                !searchLoading ? (
                  <MagnifyingGlassIcon className="w-4 h-4" />
                ) : undefined
              }
            >
              {searchLoading ? "Searching..." : "Search Jobs"}
            </Button>
          </div>

          {/* Job Results */}
          <AnimatePresence>
            {showResults && jobResults.length > 0 && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5"
              >
                {jobResults.map((job) => {
                  const isExpanded = expandedJobId === job.id;
                  const alreadyApplied = isJobAppliedInPipeline(job);
                  return (
                    <motion.div key={job.id} variants={item} layout>
                      <div className="border border-border/60 rounded-xl bg-background hover:shadow-md transition-shadow overflow-hidden">
                        {/* Card header */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <button
                              onClick={() => toggleJobDetails(job.id)}
                              className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 cursor-pointer hover:from-gray-200 hover:to-gray-300 transition-colors"
                              title="View Details"
                            >
                              <span className="text-sm font-bold text-text-secondary">
                                {job.company[0]}
                              </span>
                            </button>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${matchBg(job.match)} ${matchColor(job.match)}`}
                              >
                                {job.match}% match
                              </span>
                            </div>
                          </div>

                          <div
                            className="cursor-pointer rounded-lg -mx-1 px-1 py-0.5 hover:bg-surface-hover/50 transition-colors"
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleJobDetails(job.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleJobDetails(job.id);
                              }
                            }}
                          >
                            <h3 className="text-sm font-semibold text-text-primary">
                              {job.role}
                            </h3>

                            <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                              <BuildingOffice2Icon className="w-3 h-3" />
                              {job.company}
                            </p>
                            <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                              <MapPinIcon className="w-3 h-3" />
                              {job.location}
                            </p>
                            <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                              <CurrencyDollarIcon className="w-3 h-3" />
                              {job.salaryRange}
                            </p>
                            <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                              <ClockIcon className="w-3 h-3" />
                              Posted {job.posted}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                sourceBadgeColor[job.source] ??
                                "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300"
                              }`}
                              >
                                {job.source}
                              </span>
                              {job.applyLink ? (
                                <span className="text-[10px] text-text-secondary">
                                  Click for full description · Apply on company site opens in a new tab
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => toggleJobDetails(job.id)}
                              icon={
                                isExpanded ? (
                                  <ChevronUpIcon className="w-3 h-3" />
                                ) : (
                                  <ChevronDownIcon className="w-3 h-3" />
                                )
                              }
                            >
                              {isExpanded ? "Hide Details" : "View Details"}
                            </Button>
                            {alreadyApplied ? (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                Applied
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="accent"
                                onClick={() => handleApplyNow(job)}
                              >
                                Apply Now
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-2 border-t border-border/40 space-y-3">
                                {/* Description */}
                                <div>
                                  <h4 className="text-xs font-semibold text-text-primary mb-1">
                                    Job Description
                                  </h4>
                                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                                    {job.description || "No description returned — open the employer site below."}
                                  </p>
                                  {job.applyLink ? (
                                    <a
                                      href={job.applyLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                                    >
                                      <ArrowTopRightOnSquareIcon className="w-4 h-4 shrink-0" />
                                      Open original job posting to apply (Workday, Greenhouse, etc.)
                                    </a>
                                  ) : null}
                                </div>

                                {/* Requirements */}
                                <div>
                                  <h4 className="text-xs font-semibold text-text-primary mb-1">
                                    Requirements
                                  </h4>
                                  <ul className="space-y-1">
                                    {job.requirements.map((req, i) => (
                                      <li
                                        key={i}
                                        className="text-xs text-text-secondary flex items-start gap-1.5"
                                      >
                                        <span className="text-primary mt-0.5">
                                          &bull;
                                        </span>
                                        {req}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Qualifications */}
                                <div>
                                  <h4 className="text-xs font-semibold text-text-primary mb-1">
                                    Preferred Qualifications
                                  </h4>
                                  <ul className="space-y-1">
                                    {job.qualifications.map((qual, i) => (
                                      <li
                                        key={i}
                                        className="text-xs text-text-secondary flex items-start gap-1.5"
                                      >
                                        <span className="text-accent mt-0.5">
                                          &bull;
                                        </span>
                                        {qual}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Company info */}
                                <div>
                                  <h4 className="text-xs font-semibold text-text-primary mb-1">
                                    About {job.company}
                                  </h4>
                                  <p className="text-xs text-text-secondary leading-relaxed">
                                    {job.companyInfo}
                                  </p>
                                </div>

                                {/* Bottom apply button */}
                                <div className="pt-1">
                                  {alreadyApplied ? (
                                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                      You already have this role in your pipeline as Applied or later.
                                    </p>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="accent"
                                      onClick={() => handleApplyNow(job)}
                                    >
                                      Apply Now
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
          {showResults && !searchLoading && jobResults.length === 0 && (
            <p className="mt-4 text-center text-sm text-text-secondary py-6">
              No job listings for that search. Try other keywords, or confirm the backend can reach JSearch / Remotive.
            </p>
          )}
        </Card>
        </div>

        {/* ── Main Grid ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ── Left: Applications ─────────────────── */}
          <div className="lg:col-span-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {(
                ["all", "applied", "screening", "interview", "offer", "rejected"] as const
              ).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer
                    ${
                      filter === s
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                    }
                  `}
                >
                  {s === "all" ? "All" : statusLabel[s]} ({statusCounts[s]})
                </button>
              ))}
            </div>

            {/* Application Cards */}
            {appsLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="h-9 w-9 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-text-secondary">Loading applications…</p>
              </div>
            ) : filteredApps.length === 0 ? (
              <p className="text-sm text-text-secondary py-12 text-center rounded-2xl border border-dashed border-border bg-background/50">
                No applications yet. Use <strong className="text-text-primary">Add Application</strong> or apply from job search results.
              </p>
            ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {filteredApps.map((app) => (
                <motion.div key={app.id} variants={item}>
                  <Card hover padding="md" className="overflow-hidden">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        className="flex-1 min-w-0 text-left cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        onClick={() =>
                          setExpandedAppId((id) => (id === app.id ? null : app.id))
                        }
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-text-secondary">
                              {app.company[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-text-primary">
                              {app.role}
                            </h3>
                            <p className="text-sm text-text-secondary">
                              {app.company}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <Badge variant={statusVariant[app.status]}>
                                {statusLabel[app.status]}
                              </Badge>
                              <span className="text-xs text-text-secondary">
                                Applied{" "}
                                {new Date(app.appliedDate).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </span>
                              {app.deadline && (
                                <span className="text-xs text-error font-medium">
                                  Due{" "}
                                  {new Date(app.deadline).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" }
                                  )}
                                </span>
                              )}
                            </div>
                            {app.notes && (
                              <p className="text-xs text-text-secondary mt-2 italic">
                                {app.notes}
                              </p>
                            )}
                            <p className="text-[11px] text-text-secondary mt-2">
                              {expandedAppId === app.id ? "Click to collapse" : "Click for job description · use ↗ to open the original posting"}
                            </p>
                          </div>
                        </div>
                      </button>
                      {app.url ? (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors inline-flex shrink-0 self-start"
                          aria-label={`Open original posting: ${app.company}`}
                          title="Open original job posting in a new tab"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4 text-text-secondary" />
                        </a>
                      ) : null}
                    </div>
                    <AnimatePresence initial={false}>
                      {expandedAppId === app.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                              Job description
                            </h4>
                            <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                              {app.jobDescription?.trim() ||
                                "No description stored for this application. Open the original posting if available."}
                            </p>
                            {app.url ? (
                              <a
                                href={app.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                              >
                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                Apply on employer site (new tab)
                              </a>
                            ) : null}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
            )}
          </div>

          {/* ── Right Sidebar ─────────────────────── */}
          <div className="space-y-6">
            {/* Resume Upload */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DocumentTextIcon className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-text-primary">
                  Resume
                </h2>
              </div>
              <Card padding="sm">
                {resumeFile ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <DocumentArrowUpIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-text-primary truncate">
                        {resumeFile.name}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mb-3">
                      Uploaded{" "}
                      {new Date(resumeFile.uploadedAt).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Replace
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setResumeFile(null);
                          addToast({ message: "Resume removed.", type: "info" });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <DocumentArrowUpIcon className="w-8 h-8 mx-auto text-text-secondary/40 mb-2" />
                    <p className="text-xs text-text-secondary mb-3">
                      Upload your resume for AI-powered suggestions
                    </p>
                    <Button
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      icon={<DocumentArrowUpIcon className="w-4 h-4" />}
                    >
                      Upload Resume
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleResumeUpload}
                />
              </Card>
            </div>

            {/* AI Suggestions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-text-primary">
                  AI Suggestions
                </h2>
              </div>
              <div className="space-y-3">
                {mockCareerSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card padding="sm" hover>
                      <h3 className="text-sm font-medium text-text-primary mb-1">
                        {suggestion.title}
                      </h3>
                      <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                        {suggestion.description}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => handleCareerSuggestionAction(suggestion)}
                      >
                        {suggestion.actionLabel}
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Add Application Modal ───────────────── */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Application"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const local: Application = {
                id: crypto.randomUUID(),
                company: newAppCompany,
                role: newAppRole,
                status: newAppStatus,
                appliedDate: new Date().toISOString().slice(0, 10),
                deadline: newAppDeadline || undefined,
                notes: newAppNotes || undefined,
              };
              try {
                const created = await createApplication({
                  company: newAppCompany,
                  role: newAppRole,
                  status: newAppStatus,
                  applied_date: local.appliedDate,
                  notes: newAppNotes,
                  job_url: "",
                  job_description: "",
                });
                if (created && typeof created === "object" && "id" in created) {
                  local.id = String((created as { id: string }).id);
                }
              } catch {
                addToast({ message: "Saved locally; API sync failed", type: "warning" });
              }
              setApplications((prev) => [...prev, local]);
              setNewAppCompany("");
              setNewAppRole("");
              setNewAppStatus("applied");
              setNewAppDeadline("");
              setNewAppNotes("");
              setShowAddModal(false);
              addToast({ message: "Application added!", type: "success" });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Company
              </label>
              <input
                type="text"
                required
                value={newAppCompany}
                onChange={(e) => setNewAppCompany(e.target.value)}
                placeholder="e.g., Google"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Role
              </label>
              <input
                type="text"
                required
                value={newAppRole}
                onChange={(e) => setNewAppRole(e.target.value)}
                placeholder="e.g., Software Engineering Intern"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Status
                </label>
                <select
                  value={newAppStatus}
                  onChange={(e) => setNewAppStatus(e.target.value as Application["status"])}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="screening">Screening</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Deadline
                </label>
                <input
                  type="date"
                  value={newAppDeadline}
                  onChange={(e) => setNewAppDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Notes
              </label>
              <textarea
                value={newAppNotes}
                onChange={(e) => setNewAppNotes(e.target.value)}
                placeholder="Any notes about this application..."
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Application
              </Button>
            </div>
          </form>
        </Modal>

        {/* ── Auto-Apply Preview Modal ────────────── */}
        <Modal
          isOpen={applyModalOpen}
          onClose={closeApplyModal}
          title={
            applySuccess
              ? "Application sent"
              : applyNeedsAtsBoost && applyReviewStep === 0
                ? "Tailoring your resume (live)"
                : "Review & submit application"
          }
        >
          <div className="space-y-4">
            {applySuccess ? (
              /* Success state */
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6"
              >
                <CheckCircleIcon className="w-14 h-14 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  Application Submitted!
                </h3>
                <p className="text-sm text-text-secondary mb-1">
                  Your application for{" "}
                  <span className="font-medium text-text-primary">
                    {applyTarget?.role}
                  </span>{" "}
                  at{" "}
                  <span className="font-medium text-text-primary">
                    {applyTarget?.company}
                  </span>{" "}
                  has been submitted successfully.
                </p>
                <p className="text-xs text-text-secondary mb-4">
                  You will receive a confirmation email shortly.
                </p>
                <Button onClick={closeApplyModal}>Done</Button>
              </motion.div>
            ) : applyNeedsAtsBoost && applyReviewStep === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">
                  Match was under {ATS_BOOST_THRESHOLD}%, so we&apos;re aligning your resume to this posting before
                  you review and submit. Activity updates appear below.
                </p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-background/80 p-3 font-mono text-[11px] text-text-secondary space-y-1">
                  {atsActivityLog.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                  {atsOptimizing ? (
                    <p className="text-primary animate-pulse">Working…</p>
                  ) : null}
                </div>
                <Button variant="secondary" onClick={closeApplyModal} className="w-full">
                  Cancel
                </Button>
              </div>
            ) : (
              /* Pre-fill form */
              <>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {applyNeedsAtsBoost
                    ? "Your resume was tuned for ATS keyword overlap with this job. Edit the draft if you want, then submit."
                    : "Review your application details before submitting. LifeOps has pre-filled the information from your profile and resume."}
                </p>

                {/* Target job */}
                {applyTarget && (
                  <div className="bg-background rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">{applyTarget.role}</p>
                      {applyNeedsAtsBoost && estimatedAtsPercent != null ? (
                        <Badge variant="success">Est. ATS fit ~{estimatedAtsPercent}%</Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-text-secondary">
                      {applyTarget.company} &middot; {applyTarget.location}
                    </p>
                    {applyNeedsAtsBoost && atsChangeSummary ? (
                      <p className="text-xs text-text-secondary mt-2 leading-relaxed">{atsChangeSummary}</p>
                    ) : null}
                  </div>
                )}

                {applyNeedsAtsBoost ? (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Resume text we will send (editable)
                    </label>
                    <textarea
                      value={optimizedResumeDraft}
                      onChange={(e) => setOptimizedResumeDraft(e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-text-primary font-mono leading-relaxed resize-y min-h-[160px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                ) : null}

                {/* Pre-filled fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={user?.name ?? "Your Name"}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-border rounded-xl text-sm text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Email
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={user?.email ?? "your@email.com"}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-border rounded-xl text-sm text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Resume file
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-border rounded-xl">
                      <DocumentTextIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-text-primary">
                        {resumeFile?.name ?? "No resume"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={closeApplyModal}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitApplication}
                    loading={applySubmitting || atsOptimizing}
                    className="flex-1"
                  >
                    {applySubmitting ? "Submitting..." : "Submit application"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
