import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DetectionContext, ToolPattern } from "../types.js";

const TESTING_PATTERNS: ToolPattern[] = [
	// JavaScript/TypeScript Testing
	{
		name: "vitest",
		configFiles: ["vitest.config.ts", "vitest.config.js", "vitest.config.mjs"],
		dependencies: ["vitest"],
	},
	{
		name: "jest",
		configFiles: ["jest.config.js", "jest.config.ts", "jest.config.json"],
		dependencies: ["jest"],
	},
	{
		name: "mocha",
		configFiles: [".mocharc.js", ".mocharc.json", ".mocharc.yaml"],
		dependencies: ["mocha"],
	},
	{
		name: "ava",
		dependencies: ["ava"],
	},
	{
		name: "tap",
		dependencies: ["tap"],
	},

	// E2E Testing
	{
		name: "playwright",
		configFiles: ["playwright.config.ts", "playwright.config.js"],
		dependencies: ["@playwright/test", "playwright"],
	},
	{
		name: "cypress",
		configFiles: ["cypress.config.ts", "cypress.config.js", "cypress.json"],
		dependencies: ["cypress"],
	},
	{
		name: "puppeteer",
		dependencies: ["puppeteer"],
	},
	{
		name: "selenium",
		dependencies: ["selenium-webdriver"],
	},

	// Component Testing
	{
		name: "testing-library",
		dependencies: [
			"@testing-library/react",
			"@testing-library/vue",
			"@testing-library/svelte",
			"@testing-library/dom",
		],
	},
	{
		name: "enzyme",
		dependencies: ["enzyme"],
	},

	// Python Testing
	{
		name: "pytest",
		configFiles: ["pytest.ini", "pyproject.toml"],
		files: ["tests/", "test/"],
	},
	{
		name: "unittest",
		// Built into Python, detected via test files
	},

	// Ruby Testing
	{
		name: "rspec",
		files: ["spec/", ".rspec"],
	},
	{
		name: "minitest",
		files: ["test/"],
	},

	// Go Testing
	{
		name: "go-test",
		// Built into Go, detected via _test.go files
	},

	// Rust Testing
	{
		name: "cargo-test",
		// Built into Cargo
	},
];

/**
 * Detect testing frameworks in the project
 */
export function detectTesting(ctx: DetectionContext): string[] {
	const detected: string[] = [];

	for (const pattern of TESTING_PATTERNS) {
		if (matchesTestingPattern(pattern, ctx)) {
			detected.push(pattern.name);
		}
	}

	return detected;
}

function matchesTestingPattern(pattern: ToolPattern, ctx: DetectionContext): boolean {
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
