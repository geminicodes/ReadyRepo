// History and README Library types

export interface HistoryAnalysis {
  id: string;
  githubUsername: string;
  githubAvatar: string;
  jobTitle: string;
  jobCompany: string;
  overallScore: number;
  technicalScore: number;
  experienceScore: number;
  relevanceScore: number;
  analyzedAt: string;
  repoCount: number;
}

export interface SavedREADME {
  id: string;
  repoName: string;
  repoUrl: string;
  tone: 'startup' | 'corporate' | 'formal' | 'casual' | 'innovative';
  jobContext: string;
  markdown: string;
  generatedAt: string;
  analysisId: string;
}

export const toneColors: Record<string, string> = {
  startup: 'bg-primary/20 text-primary border-primary/30',
  corporate: 'bg-muted text-muted-foreground border-border',
  formal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  casual: 'bg-green-500/20 text-green-400 border-green-500/30',
  innovative: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export const toneLabels: Record<string, string> = {
  startup: 'Startup',
  corporate: 'Corporate',
  formal: 'Formal',
  casual: 'Casual',
  innovative: 'Innovative',
};

// Mock data for development
export const mockHistoryData: HistoryAnalysis[] = [
  {
    id: '1',
    githubUsername: 'octocat',
    githubAvatar: 'https://github.com/octocat.png',
    jobTitle: 'Senior Frontend Engineer',
    jobCompany: 'TechCorp',
    overallScore: 87,
    technicalScore: 92,
    experienceScore: 85,
    relevanceScore: 84,
    analyzedAt: '2024-12-28T10:30:00Z',
    repoCount: 12,
  },
  {
    id: '2',
    githubUsername: 'octocat',
    githubAvatar: 'https://github.com/octocat.png',
    jobTitle: 'Full Stack Developer',
    jobCompany: 'StartupXYZ',
    overallScore: 72,
    technicalScore: 78,
    experienceScore: 70,
    relevanceScore: 68,
    analyzedAt: '2024-12-25T14:15:00Z',
    repoCount: 12,
  },
  {
    id: '3',
    githubUsername: 'octocat',
    githubAvatar: 'https://github.com/octocat.png',
    jobTitle: 'React Developer',
    jobCompany: 'BigTech Inc',
    overallScore: 91,
    technicalScore: 95,
    experienceScore: 88,
    relevanceScore: 90,
    analyzedAt: '2024-12-20T09:00:00Z',
    repoCount: 12,
  },
  {
    id: '4',
    githubUsername: 'octocat',
    githubAvatar: 'https://github.com/octocat.png',
    jobTitle: 'Backend Engineer',
    jobCompany: 'DataFlow',
    overallScore: 45,
    technicalScore: 40,
    experienceScore: 50,
    relevanceScore: 45,
    analyzedAt: '2024-12-15T16:45:00Z',
    repoCount: 12,
  },
  {
    id: '5',
    githubUsername: 'octocat',
    githubAvatar: 'https://github.com/octocat.png',
    jobTitle: 'DevOps Engineer',
    jobCompany: 'CloudNine',
    overallScore: 63,
    technicalScore: 60,
    experienceScore: 65,
    relevanceScore: 64,
    analyzedAt: '2024-12-10T11:20:00Z',
    repoCount: 12,
  },
];

export const mockREADMEData: SavedREADME[] = [
  {
    id: '1',
    repoName: 'react-dashboard',
    repoUrl: 'https://github.com/octocat/react-dashboard',
    tone: 'startup',
    jobContext: 'Senior Frontend Engineer at TechCorp',
    markdown: `# React Dashboard

A modern, responsive dashboard built with React, TypeScript, and Tailwind CSS.

## ✨ Features

- 📊 Real-time data visualization with Recharts
- 🎨 Beautiful glassmorphism UI design
- 📱 Fully responsive across all devices
- 🔐 Secure authentication with JWT
- ⚡ Fast performance with Vite

## 🚀 Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## 🛠️ Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Recharts** - Data Visualization
- **React Query** - Server State

## 📄 License

MIT License - feel free to use in your projects!`,
    generatedAt: '2024-12-28T10:35:00Z',
    analysisId: '1',
  },
  {
    id: '2',
    repoName: 'node-api-server',
    repoUrl: 'https://github.com/octocat/node-api-server',
    tone: 'corporate',
    jobContext: 'Full Stack Developer at StartupXYZ',
    markdown: `# Node.js API Server

Enterprise-grade REST API server built with Node.js, Express, and PostgreSQL.

## Overview

This project provides a robust, scalable backend solution for modern web applications.

## Installation

\`\`\`bash
npm install
npm run start
\`\`\`

## Documentation

Comprehensive API documentation is available at \`/api/docs\`.

## Security

- JWT-based authentication
- Rate limiting
- Input validation
- SQL injection prevention`,
    generatedAt: '2024-12-25T14:20:00Z',
    analysisId: '2',
  },
  {
    id: '3',
    repoName: 'ml-classifier',
    repoUrl: 'https://github.com/octocat/ml-classifier',
    tone: 'innovative',
    jobContext: 'AI/ML Engineer at DataFlow',
    markdown: `# 🤖 ML Classifier

Cutting-edge machine learning classifier using state-of-the-art transformer models.

## 🧠 What Makes This Special

This isn't your average classifier. We've pushed the boundaries with:

- **Zero-shot classification** - No training required for new categories
- **Multi-modal support** - Text, images, and audio
- **Edge deployment** - Optimized for mobile and IoT devices

## 🔬 Research Background

Based on the latest papers from ICML and NeurIPS 2024.`,
    generatedAt: '2024-12-20T09:05:00Z',
    analysisId: '3',
  },
  {
    id: '4',
    repoName: 'portfolio-site',
    repoUrl: 'https://github.com/octocat/portfolio-site',
    tone: 'casual',
    jobContext: 'React Developer at BigTech Inc',
    markdown: `# Hey, Welcome to My Portfolio! 👋

This is where I showcase my work and experiments.

## What's Inside?

- A collection of my best projects
- Blog posts about things I've learned
- Contact form (yes, it actually works!)

## Built With Love Using

React + Framer Motion + A lot of coffee ☕

Feel free to poke around and reach out!`,
    generatedAt: '2024-12-15T16:50:00Z',
    analysisId: '4',
  },
  {
    id: '5',
    repoName: 'enterprise-cms',
    repoUrl: 'https://github.com/octocat/enterprise-cms',
    tone: 'formal',
    jobContext: 'Senior Developer at Enterprise Co',
    markdown: `# Enterprise Content Management System

## Executive Summary

This Content Management System has been designed to meet the rigorous requirements of enterprise-level organizations.

## System Requirements

- Node.js 18.x or higher
- PostgreSQL 14+
- Redis 7.x

## Installation Guide

Please refer to the comprehensive installation documentation in the \`/docs\` directory.

## Support

For technical support, please contact the development team.`,
    generatedAt: '2024-12-10T11:25:00Z',
    analysisId: '5',
  },
];
