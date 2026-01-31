import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DetectionContext, FrameworkPattern } from "../types.js";

/**
 * Framework detection patterns ordered by specificity (most specific first)
 */
const FRAMEWORK_PATTERNS: FrameworkPattern[] = [
	// JavaScript/TypeScript Frameworks
	{
		name: "nextjs",
		configFiles: ["next.config.js", "next.config.ts", "next.config.mjs", "next.config.cjs"],
		dependencies: ["next"],
	},
	{
		name: "remix",
		configFiles: ["remix.config.js", "remix.config.ts"],
		dependencies: ["@remix-run/react", "@remix-run/node"],
	},
	{
		name: "astro",
		configFiles: ["astro.config.mjs", "astro.config.ts", "astro.config.js"],
		dependencies: ["astro"],
	},
	{
		name: "nuxt",
		configFiles: ["nuxt.config.js", "nuxt.config.ts"],
		dependencies: ["nuxt", "nuxt3"],
	},
	{
		name: "sveltekit",
		configFiles: ["svelte.config.js", "svelte.config.ts"],
		dependencies: ["@sveltejs/kit"],
	},
	{
		name: "svelte",
		dependencies: ["svelte"],
	},
	{
		name: "vue",
		configFiles: ["vue.config.js"],
		dependencies: ["vue", "@vue/cli-service"],
	},
	{
		name: "angular",
		configFiles: ["angular.json"],
		dependencies: ["@angular/core"],
	},
	{
		name: "gatsby",
		configFiles: ["gatsby-config.js", "gatsby-config.ts"],
		dependencies: ["gatsby"],
	},
	{
		name: "vite",
		// Only detect via dependency, not config files (vitest also uses vite.config)
		dependencies: ["vite"],
	},
	{
		name: "express",
		dependencies: ["express"],
	},
	{
		name: "fastify",
		dependencies: ["fastify"],
	},
	{
		name: "hono",
		dependencies: ["hono"],
	},
	{
		name: "elysia",
		dependencies: ["elysia"],
	},
	{
		name: "nest",
		dependencies: ["@nestjs/core"],
	},
	// React (general - detected after specific React frameworks)
	{
		name: "react",
		dependencies: ["react", "react-dom"],
	},

	// Python Frameworks
	{
		name: "django",
		configFiles: ["manage.py"],
		requiredFiles: ["manage.py"],
	},
	{
		name: "flask",
		// Flask is typically detected via dependencies in pyproject.toml/requirements.txt
		// We'll check for app.py as a common pattern
		configFiles: ["app.py"],
	},
	{
		name: "fastapi",
		configFiles: ["main.py"],
	},

	// Ruby Frameworks
	{
		name: "rails",
		configFiles: ["config/application.rb"],
		requiredFiles: ["Gemfile", "config/application.rb"],
	},
	{
		name: "sinatra",
		// Detected via Gemfile
	},

	// Go Frameworks
	{
		name: "gin",
		// Detected via go.mod
	},
	{
		name: "echo",
		// Detected via go.mod
	},
	{
		name: "fiber",
		// Detected via go.mod
	},

	// Rust Frameworks
	{
		name: "actix",
		// Detected via Cargo.toml
	},
	{
		name: "axum",
		// Detected via Cargo.toml
	},
	{
		name: "rocket",
		// Detected via Cargo.toml
	},

	// Java/Kotlin Frameworks
	{
		name: "spring",
		configFiles: ["pom.xml", "build.gradle", "build.gradle.kts"],
	},
];

/**
 * Detect frameworks in the project
 */
export function detectFrameworks(ctx: DetectionContext): string[] {
	const detected: string[] = [];

	for (const pattern of FRAMEWORK_PATTERNS) {
		if (matchesPattern(pattern, ctx)) {
			detected.push(pattern.name);
		}
	}

	return detected;
}

function matchesPattern(pattern: FrameworkPattern, ctx: DetectionContext): boolean {
	// Check required files (all must exist)
	if (pattern.requiredFiles) {
		const allExist = pattern.requiredFiles.every((file) => existsSync(join(ctx.cwd, file)));
		if (allExist) return true;
	}

	// Check config files (any one existing is enough)
	if (pattern.configFiles) {
		const anyExists = pattern.configFiles.some((file) => existsSync(join(ctx.cwd, file)));
		if (anyExists) return true;
	}

	// Check dependencies
	if (pattern.dependencies) {
		const hasAnyDep = pattern.dependencies.some((dep) => dep in ctx.allDependencies);
		if (hasAnyDep) return true;
	}

	return false;
}
