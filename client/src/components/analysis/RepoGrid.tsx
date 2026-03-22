import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Star, GitFork, CheckCircle, Sparkles, FileText, Calendar } from 'lucide-react';
import { RepoAnalysis, languageColors } from '@/types/analysis';
import { Button } from '@/components/ui/button';
import { READMEModal } from './READMEModal';
import { authFetch } from "@/services/authFetch";
import type { GenerateReadmeRequest, GitHubRepo, JobPosting } from "@readyrepo/shared";
import { useAnalysis } from "@/context/AnalysisContext";

interface RepoGridProps {
  repositories: RepoAnalysis[];
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-green-500 text-green-950';
  if (score >= 60) return 'bg-yellow-500 text-yellow-950';
  return 'bg-orange-500 text-orange-950';
};

// Mock generated README for demo
const mockGeneratedReadme = `# 🚀 E-Commerce Platform

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

A full-stack e-commerce platform built with modern technologies, featuring real-time inventory management, secure payment processing, and a responsive user interface.

## ✨ Features

- 🛒 **Shopping Cart** - Add, remove, and update items with real-time price calculations
- 💳 **Secure Payments** - Stripe integration for safe transactions
- 📦 **Inventory Management** - Real-time stock tracking and low-stock alerts
- 🔍 **Advanced Search** - Full-text search with filters and sorting
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## 🛠️ Tech Stack

| Frontend | Backend | Database |
|----------|---------|----------|
| React 18 | Node.js | PostgreSQL |
| TypeScript | Express | Redis |
| Tailwind CSS | GraphQL | Prisma ORM |

## 🚀 Quick Start

\`\`\`bash
# Clone the repository
git clone https://github.com/username/ecommerce-platform.git

# Install dependencies
cd ecommerce-platform
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
\`\`\`

## 📁 Project Structure

\`\`\`
├── src/
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── services/      # API services
│   └── utils/         # Utility functions
├── server/
│   ├── routes/        # API routes
│   ├── controllers/   # Request handlers
│   └── models/        # Database models
└── prisma/
    └── schema.prisma  # Database schema
\`\`\`

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
`;

const mockCurrentReadme = `# ecommerce-platform

An e-commerce app built with React.

## Installation

\`\`\`
npm install
npm start
\`\`\`

## Features

- Shopping cart
- Payments
- User accounts
`;

export function RepoGrid({ repositories }: RepoGridProps) {
  const [selectedRepo, setSelectedRepo] = useState<RepoAnalysis | null>(null);
  const [enhancedRepos, setEnhancedRepos] = useState<Set<string>>(new Set());
  const { lastJob, analysisResult } = useAnalysis();

  const apiBase = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/+$/, "");

  const extractRepoFromResponse = (json: unknown): GitHubRepo | null => {
    if (!json || typeof json !== "object" || Array.isArray(json)) return null;
    const data = (json as Record<string, unknown>)["data"];
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const repo = (data as Record<string, unknown>)["repo"];
    return (repo as GitHubRepo) ?? null;
  };

  const extractGeneratedReadme = (json: unknown): string | null => {
    if (!json || typeof json !== "object" || Array.isArray(json)) return null;
    const data = (json as Record<string, unknown>)["data"];
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const generated = (data as Record<string, unknown>)["generatedReadme"];
    return typeof generated === "string" && generated.trim() ? generated : null;
  };

  const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
    try {
      const u = new URL(url);
      if (u.hostname !== "github.com") return null;
      const parts = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
      if (parts.length < 2) return null;
      return { owner: parts[0], repo: parts[1] };
    } catch {
      return null;
    }
  };

  const handleGenerateReadme = async (): Promise<string> => {
    if (!selectedRepo) throw new Error("No repository selected.");
    if (!lastJob) throw new Error("Missing job details for README generation.");

    const parsed = parseGitHubUrl(selectedRepo.url);
    if (!parsed) throw new Error("Unsupported repository URL.");

    // 1) Fetch repo snapshot from backend (GitHub API normalization + README fetch)
    const repoRes = await authFetch(`${apiBase}/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`);
    const repoJson = (await repoRes.json().catch(() => null)) as unknown;
    if (!repoRes.ok) {
      // Never surface raw backend error text (could include sensitive details).
      if (repoRes.status === 401) throw new Error("Your session expired. Please sign in again.");
      throw new Error("Failed to load repository.");
    }
    const repo = extractRepoFromResponse(repoJson);
    if (!repo) throw new Error("Invalid repo response.");

    // 2) Build job payload (shared type)
    const job: JobPosting = {
      url: lastJob.jobUrl,
      title: lastJob.jobTitle,
      company: null,
      description: lastJob.description,
      requirements: [],
      skills: [],
      experienceLevel: null,
      rawText: lastJob.description,
    };

    // 3) Generate README
    const body: GenerateReadmeRequest = {
      repo,
      currentReadme: repo.readme ?? null,
      job,
      analysisId: analysisResult?.id?.startsWith("local-") ? null : (analysisResult?.id ?? null),
    };

    const genRes = await authFetch(`${apiBase}/generate-readme`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const genJson = (await genRes.json().catch(() => null)) as unknown;
    if (!genRes.ok) {
      // Never surface raw backend error text (could include sensitive details).
      if (genRes.status === 401) throw new Error("Your session expired. Please sign in again.");
      throw new Error("README generation failed.");
    }
    const generated = extractGeneratedReadme(genJson);
    if (!generated) throw new Error("Empty README generated.");
    return generated;
  };

  const handleModalClose = () => {
    if (selectedRepo) {
      setEnhancedRepos(prev => new Set([...prev, selectedRepo.name]));
    }
    setSelectedRepo(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">
            Repository Analysis
          </h2>
          <p className="text-muted-foreground">
            How each repo contributes to your fit score
          </p>
        </div>

        {/* Repo Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {repositories.map((repo, index) => {
            const isEnhanced = enhancedRepos.has(repo.name) || repo.readmeGenerated;
            
            return (
              <motion.div
                key={repo.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass rounded-2xl p-6 relative group hover:shadow-[0_0_40px_hsl(187_94%_44%/0.15)] transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Relevance Score Badge */}
                <div className={`absolute -top-3 -right-3 w-14 h-14 rounded-full ${getScoreColor(repo.relevanceScore)} flex items-center justify-center font-bold text-lg shadow-lg`}>
                  {repo.relevanceScore}
                </div>

                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-display text-lg font-semibold hover:text-primary transition-colors flex items-center gap-2"
                    >
                      {repo.name}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {isEnhanced && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                        <CheckCircle className="w-3 h-3" />
                        README Enhanced
                      </span>
                    )}
                  </div>

                  {/* Language Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {repo.languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-1 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: `${languageColors[lang] || '#6b7280'}20`,
                          color: languageColors[lang] || '#6b7280',
                          border: `1px solid ${languageColors[lang] || '#6b7280'}40`,
                        }}
                      >
                        {lang}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {repo.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-4 h-4" />
                      {repo.forks}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(repo.lastUpdated).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {repo.description}
                </p>

                {/* Why It Matters */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                  <p className="text-sm text-foreground">
                    <span className="font-medium text-primary">Why it matters: </span>
                    {repo.whyItMatters}
                  </p>
                </div>

                {/* Highlights */}
                <div className="space-y-2 mb-4">
                  {repo.highlights.slice(0, 3).map((highlight, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-muted-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>

                {/* Generate README Button */}
                <Button
                  variant={isEnhanced ? "outline" : "hero"}
                  size="default"
                  className="w-full group"
                  onClick={() => setSelectedRepo(repo)}
                >
                  {isEnhanced ? (
                    <>
                      <FileText className="w-4 h-4" />
                      View Enhanced README
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      Generate Better README
                    </>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* README Modal */}
      <READMEModal
        isOpen={!!selectedRepo}
        onClose={handleModalClose}
        repoName={selectedRepo?.name || ''}
        currentReadme={mockCurrentReadme}
        onGenerate={handleGenerateReadme}
      />
    </>
  );
}