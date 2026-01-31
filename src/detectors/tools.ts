import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DetectionContext, ToolPattern } from "../types.js";

const TOOL_PATTERNS: ToolPattern[] = [
	// ORMs & Databases
	{
		name: "prisma",
		configFiles: ["prisma/schema.prisma"],
		dependencies: ["prisma", "@prisma/client"],
	},
	{
		name: "drizzle",
		configFiles: ["drizzle.config.ts", "drizzle.config.js"],
		dependencies: ["drizzle-orm"],
	},
	{
		name: "typeorm",
		dependencies: ["typeorm"],
	},
	{
		name: "sequelize",
		dependencies: ["sequelize"],
	},
	{
		name: "mongoose",
		dependencies: ["mongoose"],
	},
	{
		name: "kysely",
		dependencies: ["kysely"],
	},

	// CSS & Styling
	{
		name: "tailwind",
		configFiles: [
			"tailwind.config.js",
			"tailwind.config.ts",
			"tailwind.config.mjs",
			"tailwind.config.cjs",
		],
		dependencies: ["tailwindcss"],
	},
	{
		name: "styled-components",
		dependencies: ["styled-components"],
	},
	{
		name: "emotion",
		dependencies: ["@emotion/react", "@emotion/styled"],
	},
	{
		name: "sass",
		dependencies: ["sass", "node-sass"],
	},
	{
		name: "less",
		dependencies: ["less"],
	},

	// Build Tools
	{
		name: "webpack",
		configFiles: ["webpack.config.js", "webpack.config.ts"],
		dependencies: ["webpack"],
	},
	{
		name: "esbuild",
		dependencies: ["esbuild"],
	},
	{
		name: "rollup",
		configFiles: ["rollup.config.js", "rollup.config.ts"],
		dependencies: ["rollup"],
	},
	{
		name: "turbopack",
		dependencies: ["@serwist/turbopack", "@vercel/turbopack", "turbopack"],
	},
	{
		name: "turborepo",
		configFiles: ["turbo.json"],
		dependencies: ["turbo"],
	},

	// State Management
	{
		name: "redux",
		dependencies: ["redux", "@reduxjs/toolkit"],
	},
	{
		name: "zustand",
		dependencies: ["zustand"],
	},
	{
		name: "jotai",
		dependencies: ["jotai"],
	},
	{
		name: "recoil",
		dependencies: ["recoil"],
	},
	{
		name: "mobx",
		dependencies: ["mobx"],
	},

	// API & Data Fetching
	{
		name: "graphql",
		dependencies: ["graphql", "@apollo/client", "urql"],
	},
	{
		name: "trpc",
		dependencies: ["@trpc/server", "@trpc/client"],
	},
	{
		name: "tanstack-query",
		dependencies: ["@tanstack/react-query", "react-query"],
	},
	{
		name: "swr",
		dependencies: ["swr"],
	},
	{
		name: "axios",
		dependencies: ["axios"],
	},

	// Authentication
	{
		name: "nextauth",
		dependencies: ["next-auth"],
	},
	{
		name: "clerk",
		dependencies: ["@clerk/nextjs", "@clerk/clerk-react"],
	},
	{
		name: "auth0",
		dependencies: ["@auth0/nextjs-auth0", "@auth0/auth0-react"],
	},
	{
		name: "supabase",
		dependencies: ["@supabase/supabase-js", "@supabase/auth-helpers-nextjs"],
	},
	{
		name: "firebase",
		dependencies: ["firebase", "firebase-admin"],
	},

	// DevOps & Infrastructure
	{
		name: "docker",
		configFiles: ["Dockerfile", "docker-compose.yml", "docker-compose.yaml"],
	},
	{
		name: "kubernetes",
		files: ["k8s/", "kubernetes/", "helm/"],
	},
	{
		name: "terraform",
		files: ["main.tf", "terraform/"],
	},
	{
		name: "pulumi",
		configFiles: ["Pulumi.yaml"],
	},

	// Linting & Formatting
	{
		name: "eslint",
		configFiles: [".eslintrc", ".eslintrc.js", ".eslintrc.json", "eslint.config.js"],
		dependencies: ["eslint"],
	},
	{
		name: "prettier",
		configFiles: [".prettierrc", ".prettierrc.js", ".prettierrc.json", "prettier.config.js"],
		dependencies: ["prettier"],
	},
	{
		name: "biome",
		configFiles: ["biome.json", "biome.jsonc"],
		dependencies: ["@biomejs/biome"],
	},

	// Monorepo Tools
	{
		name: "nx",
		configFiles: ["nx.json"],
		dependencies: ["nx"],
	},
	{
		name: "lerna",
		configFiles: ["lerna.json"],
		dependencies: ["lerna"],
	},
	{
		name: "changesets",
		files: [".changeset/"],
		dependencies: ["@changesets/cli"],
	},

	// Documentation
	{
		name: "storybook",
		files: [".storybook/"],
		dependencies: ["@storybook/react", "storybook"],
	},
	{
		name: "docusaurus",
		dependencies: ["@docusaurus/core"],
	},

	// AI & ML
	{
		name: "openai",
		dependencies: ["openai"],
	},
	{
		name: "anthropic",
		dependencies: ["@anthropic-ai/sdk"],
	},
	{
		name: "langchain",
		dependencies: ["langchain", "@langchain/core"],
	},
	{
		name: "vercel-ai",
		dependencies: ["ai"],
	},
];

/**
 * Detect tools and libraries in the project
 */
export function detectTools(ctx: DetectionContext): string[] {
	const detected: string[] = [];

	for (const pattern of TOOL_PATTERNS) {
		if (matchesToolPattern(pattern, ctx)) {
			detected.push(pattern.name);
		}
	}

	// Exclude superseded tools
	let filtered = detected;

	// Exclude webpack if turbopack is detected
	if (filtered.includes("turbopack") && filtered.includes("webpack")) {
		filtered = filtered.filter((t) => t !== "webpack");
	}

	// Exclude eslint/prettier if biome is detected (biome replaces both)
	if (filtered.includes("biome")) {
		filtered = filtered.filter((t) => t !== "eslint" && t !== "prettier");
	}

	return filtered;
}

function matchesToolPattern(pattern: ToolPattern, ctx: DetectionContext): boolean {
	// Check config files
	if (pattern.configFiles) {
		const anyExists = pattern.configFiles.some((file) => existsSync(join(ctx.cwd, file)));
		if (anyExists) return true;
	}

	// Check files/directories
	if (pattern.files) {
		const anyExists = pattern.files.some((file) => existsSync(join(ctx.cwd, file)));
		if (anyExists) return true;
	}

	// Check dependencies
	if (pattern.dependencies) {
		const hasAnyDep = pattern.dependencies.some((dep) => dep in ctx.allDependencies);
		if (hasAnyDep) return true;
	}

	return false;
}
