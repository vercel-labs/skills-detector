/**
 * Detected project characteristics for skill recommendations
 */
export interface DetectionResult {
	/** Detected frameworks (e.g., nextjs, remix, rails, django) */
	frameworks: string[];

	/** Detected programming languages (e.g., typescript, python, go) */
	languages: string[];

	/** Detected tools and libraries (e.g., prisma, tailwind, docker) */
	tools: string[];

	/** Detected testing frameworks (e.g., vitest, jest, playwright) */
	testing: string[];

	/** Combined search terms for skill discovery */
	searchTerms: string[];
}

/**
 * Framework detection patterns
 */
export interface FrameworkPattern {
	name: string;
	/** Config files that indicate this framework */
	configFiles?: string[];
	/** Package.json dependencies that indicate this framework */
	dependencies?: string[];
	/** Files/directories that must exist together */
	requiredFiles?: string[];
}

/**
 * Tool detection patterns
 */
export interface ToolPattern {
	name: string;
	/** Config files that indicate this tool */
	configFiles?: string[];
	/** Package.json dependencies that indicate this tool */
	dependencies?: string[];
	/** Other files that indicate this tool */
	files?: string[];
}

/**
 * Context passed to detectors
 */
export interface DetectionContext {
	/** Current working directory */
	cwd: string;
	/** Parsed package.json (if exists) */
	packageJson?: PackageJson;
	/** All dependencies (deps + devDeps merged) */
	allDependencies: Record<string, string>;
}

/**
 * Minimal package.json type for detection
 */
export interface PackageJson {
	name?: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	scripts?: Record<string, string>;
}
