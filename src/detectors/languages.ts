import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DetectionContext } from "../types.js";

interface LanguagePattern {
	name: string;
	/** Files that indicate this language */
	files?: string[];
	/** File extensions to look for */
	extensions?: string[];
	/** Package.json dependencies that indicate this language */
	dependencies?: string[];
}

const LANGUAGE_PATTERNS: LanguagePattern[] = [
	{
		name: "typescript",
		files: ["tsconfig.json", "tsconfig.base.json"],
		dependencies: ["typescript"],
	},
	{
		name: "javascript",
		files: ["package.json", "jsconfig.json"],
	},
	{
		name: "python",
		files: ["requirements.txt", "pyproject.toml", "setup.py", "Pipfile", "poetry.lock"],
	},
	{
		name: "ruby",
		files: ["Gemfile", "Gemfile.lock", ".ruby-version"],
	},
	{
		name: "go",
		files: ["go.mod", "go.sum"],
	},
	{
		name: "rust",
		files: ["Cargo.toml", "Cargo.lock"],
	},
	{
		name: "java",
		files: ["pom.xml", "build.gradle"],
	},
	{
		name: "kotlin",
		files: ["build.gradle.kts"],
	},
	{
		name: "swift",
		files: ["Package.swift", "*.xcodeproj", "*.xcworkspace"],
	},
	{
		name: "php",
		files: ["composer.json", "composer.lock"],
	},
	{
		name: "csharp",
		files: ["*.csproj", "*.sln"],
	},
	{
		name: "elixir",
		files: ["mix.exs", "mix.lock"],
	},
	{
		name: "scala",
		files: ["build.sbt"],
	},
	{
		name: "clojure",
		files: ["project.clj", "deps.edn"],
	},
	{
		name: "haskell",
		files: ["stack.yaml", "cabal.project"],
	},
	{
		name: "zig",
		files: ["build.zig"],
	},
];

/**
 * Detect programming languages in the project
 */
export function detectLanguages(ctx: DetectionContext): string[] {
	const detected: string[] = [];

	for (const pattern of LANGUAGE_PATTERNS) {
		if (matchesLanguagePattern(pattern, ctx)) {
			detected.push(pattern.name);
		}
	}

	return detected;
}

function matchesLanguagePattern(pattern: LanguagePattern, ctx: DetectionContext): boolean {
	// Check files
	if (pattern.files) {
		for (const file of pattern.files) {
			// Handle glob patterns like *.csproj
			if (file.includes("*")) {
				// Skip glob patterns for now - would need to implement glob matching
				continue;
			}
			if (existsSync(join(ctx.cwd, file))) {
				return true;
			}
		}
	}

	// Check dependencies
	if (pattern.dependencies) {
		const hasAnyDep = pattern.dependencies.some((dep) => dep in ctx.allDependencies);
		if (hasAnyDep) return true;
	}

	return false;
}
