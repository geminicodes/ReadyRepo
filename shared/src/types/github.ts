export type GitHubRepo = {
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  languages: string[];
  stars: number;
  forks: number;
  updatedAt: string;
  defaultBranch: string;
  readme: string | null;
  topics: string[];
};

