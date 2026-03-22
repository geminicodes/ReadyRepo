// Types for the analysis system

export interface AnalysisResult {
  id: string;
  githubUsername: string;
  githubAvatar: string;
  jobTitle: string;
  jobCompany: string;
  jobUrl: string;
  analyzedAt: string;
  overallScore: number;
  breakdown: ScoreBreakdown;
  strengths: Strength[];
  gaps: Gap[];
  recommendations: Recommendation[];
  repositories: RepoAnalysis[];
}

export interface ScoreBreakdown {
  technicalSkills: number;
  experienceAlignment: number;
  projectRelevance: number;
}

export interface Strength {
  point: string;
  evidence: string;
}

export interface Gap {
  gap: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface Recommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  timeEstimate: string;
  details?: string;
}

export interface RepoAnalysis {
  name: string;
  url: string;
  description: string;
  relevanceScore: number;
  languages: string[];
  stars: number;
  forks: number;
  lastUpdated: string;
  whyItMatters: string;
  highlights: string[];
  improvements: string[];
  readmeGenerated: boolean;
}

// Mock data for demonstration
export const mockAnalysisResult: AnalysisResult = {
  id: "analysis-123",
  githubUsername: "johndoe",
  githubAvatar: "https://github.com/identicons/johndoe.png",
  jobTitle: "Senior React Developer",
  jobCompany: "TechCorp Inc.",
  jobUrl: "https://linkedin.com/jobs/view/123456",
  analyzedAt: new Date().toISOString(),
  overallScore: 87,
  breakdown: {
    technicalSkills: 92,
    experienceAlignment: 78,
    projectRelevance: 85,
  },
  strengths: [
    { point: "Strong React expertise", evidence: "3 production apps with modern hooks and TypeScript" },
    { point: "Clean code practices", evidence: "Consistent code style across all repositories" },
    { point: "Active contributor", evidence: "Regular commits in the last 6 months" },
    { point: "Good documentation", evidence: "4 out of 5 repos have detailed READMEs" },
  ],
  gaps: [
    { gap: "No CI/CD experience shown", impact: "high", suggestion: "Add GitHub Actions to your main repo" },
    { gap: "Missing testing coverage", impact: "medium", suggestion: "Add Jest/Vitest tests to demonstrate TDD skills" },
    { gap: "No backend experience visible", impact: "low", suggestion: "Create a full-stack project with Node.js" },
  ],
  recommendations: [
    { action: "Add GitHub Actions workflow to your portfolio repo", priority: "high", timeEstimate: "1-2 hours", details: "Create a CI/CD pipeline that runs tests and deploys to Vercel/Netlify" },
    { action: "Add unit tests to your React projects", priority: "high", timeEstimate: "3-4 hours", details: "Focus on testing hooks and complex components" },
    { action: "Create a portfolio website showcasing your projects", priority: "medium", timeEstimate: "4-6 hours" },
    { action: "Pin your best 6 repositories on GitHub", priority: "low", timeEstimate: "15 minutes" },
  ],
  repositories: [
    {
      name: "react-dashboard",
      url: "https://github.com/johndoe/react-dashboard",
      description: "A modern admin dashboard built with React, TypeScript, and Tailwind CSS",
      relevanceScore: 95,
      languages: ["TypeScript", "React", "Tailwind CSS"],
      stars: 42,
      forks: 12,
      lastUpdated: "2024-12-01",
      whyItMatters: "Directly demonstrates React expertise with modern stack matching job requirements",
      highlights: ["TypeScript implementation", "Clean component architecture", "Responsive design"],
      improvements: ["Add unit tests", "Add CI/CD workflow", "Enhance accessibility"],
      readmeGenerated: false,
    },
    {
      name: "ecommerce-app",
      url: "https://github.com/johndoe/ecommerce-app",
      description: "Full-stack e-commerce application with React and Node.js",
      relevanceScore: 88,
      languages: ["JavaScript", "React", "Node.js"],
      stars: 28,
      forks: 8,
      lastUpdated: "2024-11-15",
      whyItMatters: "Shows ability to build production-ready applications",
      highlights: ["Full-stack implementation", "Payment integration", "User authentication"],
      improvements: ["Migrate to TypeScript", "Add testing", "Improve README"],
      readmeGenerated: true,
    },
    {
      name: "weather-widget",
      url: "https://github.com/johndoe/weather-widget",
      description: "A sleek weather widget using OpenWeather API",
      relevanceScore: 65,
      languages: ["JavaScript", "CSS", "HTML"],
      stars: 15,
      forks: 3,
      lastUpdated: "2024-08-20",
      whyItMatters: "Demonstrates API integration skills",
      highlights: ["Clean UI design", "API integration", "Responsive layout"],
      improvements: ["Convert to React", "Add TypeScript", "Add error handling"],
      readmeGenerated: false,
    },
    {
      name: "portfolio-v2",
      url: "https://github.com/johndoe/portfolio-v2",
      description: "Personal portfolio website with modern animations",
      relevanceScore: 72,
      languages: ["TypeScript", "Next.js", "Framer Motion"],
      stars: 8,
      forks: 2,
      lastUpdated: "2024-10-05",
      whyItMatters: "Shows design sensibility and animation skills",
      highlights: ["Smooth animations", "SEO optimized", "Dark mode support"],
      improvements: ["Add case studies", "Improve performance", "Add blog section"],
      readmeGenerated: false,
    },
  ],
};

// Language colors for GitHub-style pills
export const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  React: "#61dafb",
  "Node.js": "#339933",
  Python: "#3776ab",
  Go: "#00add8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  "C#": "#239120",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#f05138",
  Kotlin: "#A97BFF",
  "Tailwind CSS": "#38bdf8",
  CSS: "#563d7c",
  HTML: "#e34c26",
  "Framer Motion": "#bb4b96",
  "Next.js": "#000000",
};