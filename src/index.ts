import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { detectFrameworks } from "./detectors/frameworks.js";
import { detectLanguages } from "./detectors/languages.js";
import { detectTesting } from "./detectors/testing.js";
import { detectTools } from "./detectors/tools.js";
import type { DetectionContext, DetectionResult, PackageJson } from "./types.js";

export type { DetectionContext, DetectionResult, PackageJson } from "./types.js";

export interface DetectOptions {
	/** Working directory to analyze (defaults to process.cwd()) */
	cwd?: string;
}

/**
 * Detect project characteristics for skill recommendations
 */
export function detect(options: DetectOptions = {}): DetectionResult {
	const cwd = resolve(options.cwd ?? process.cwd());

	// Load package.json if it exists
	const packageJson = loadPackageJson(cwd);
	const allDependencies = {
		...packageJson?.dependencies,
		...packageJson?.devDependencies,
	};

	const ctx: DetectionContext = {
		cwd,
		packageJson,
		allDependencies,
	};

	// Run all detectors
	const frameworks = detectFrameworks(ctx);
	const languages = detectLanguages(ctx);
	const tools = detectTools(ctx);
	const testing = detectTesting(ctx);

	// Combine all detected items into search terms
	// Remove duplicates and sort alphabetically
	const searchTerms = [...new Set([...frameworks, ...languages, ...tools, ...testing])].sort();

	return {
		frameworks,
		languages,
		tools,
		testing,
		searchTerms,
	};
}

/**
 * Load and parse package.json from a directory
 */
function loadPackageJson(cwd: string): PackageJson | undefined {
	const packageJsonPath = join(cwd, "package.json");

	if (!existsSync(packageJsonPath)) {
		return undefined;
	}

	try {
		const content = readFileSync(packageJsonPath, "utf-8");
		return JSON.parse(content) as PackageJson;
	} catch {
		return undefined;
	}
}

// Re-export individual detectors for advanced usage
export { detectFrameworks } from "./detectors/frameworks.js";
export { detectLanguages } from "./detectors/languages.js";
export { detectTesting } from "./detectors/testing.js";
export { detectTools } from "./detectors/tools.js";
