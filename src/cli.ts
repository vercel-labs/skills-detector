#!/usr/bin/env node

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { detect } from "./index.js";
import type { DetectionResult } from "./types.js";

const SKILLS_JSON_FILE = "skills.json";

/**
 * Curated/official skill recommendations based on detected frameworks
 * These take priority over search results
 */
const CURATED_SKILLS: Record<string, string[]> = {
	// Next.js projects get official Vercel skills
	nextjs: [
		"vercel-labs/next-skills@next-best-practices",
		"vercel-labs/next-skills@next-upgrade",
		"vercel-labs/agent-skills@vercel-react-best-practices",
	],
	// React projects get Vercel React skills
	react: ["vercel-labs/agent-skills@vercel-react-best-practices"],
	// Turborepo projects
	turborepo: ["vercel/turborepo@turborepo"],
};

interface CliOptions {
	cwd?: string;
	json?: boolean;
	skipSearch?: boolean;
	help?: boolean;
	version?: boolean;
}

interface SkillEntry {
	source: string;
	skills: string[];
}

interface DetectedWithTimestamp extends DetectionResult {
	timestamp: string;
}

interface SkillsJson {
	$schema: string;
	detected: DetectedWithTimestamp;
	skills: SkillEntry[];
}

function parseArgs(args: string[]): CliOptions {
	const options: CliOptions = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "--help" || arg === "-h") {
			options.help = true;
		} else if (arg === "--version" || arg === "-v") {
			options.version = true;
		} else if (arg === "--json") {
			options.json = true;
		} else if (arg === "--skip-search") {
			options.skipSearch = true;
		} else if (arg === "--cwd" || arg === "-C") {
			options.cwd = args[++i];
		}
	}

	return options;
}

function showHelp(): void {
	console.log(`
skills-detector - Detect project characteristics and find matching skills

Usage: skills-detector [options]

Options:
  -h, --help       Show this help message
  -v, --version    Show version number
  --json           Output only JSON (no other text)
  --skip-search    Skip searching for skills (detection only)
  -C, --cwd        Working directory to analyze (default: current directory)

Examples:
  $ skills-detector                    # Analyze and search for skills
  $ skills-detector --json             # Output JSON only
  $ skills-detector --skip-search      # Detection only, no skill search
  $ skills-detector -C ./my-project    # Analyze specific directory

Output:
  Writes skills.json with detected project info and recommended skills.
  Use with skillman to install: npx skillman install
`);
}

function showVersion(): void {
	console.log("skills-detector 0.0.1");
}

// Ecosystem-specific terms that indicate a skill is for a particular platform
const ECOSYSTEM_MARKERS: Record<string, string[]> = {
	expo: ["expo", "react-native", "mobile"],
	"react-native": ["expo", "react-native", "mobile"],
	flutter: ["flutter", "dart"],
	android: ["android", "kotlin", "gradle"],
	ios: ["ios", "swift", "xcode", "cocoapods"],
	unity: ["unity", "gamedev"],
};

/**
 * Check if a skill result is relevant to the search term and project context
 */
function isRelevantSkill(skillRef: string, term: string, detectedFrameworks: string[]): boolean {
	const lowerRef = skillRef.toLowerCase();
	const lowerTerm = term.toLowerCase();

	// Check for word-boundary match (not just substring)
	// This prevents "express" matching "expression"
	const wordBoundaryRegex = new RegExp(`(^|[^a-z])${escapeRegex(lowerTerm)}([^a-z]|$)`);
	const hasTermMatch = wordBoundaryRegex.test(lowerRef);

	if (!hasTermMatch) {
		// Handle hyphenated terms (e.g., "testing-library" should match "react-testing-library")
		if (lowerTerm.includes("-") && lowerRef.includes(lowerTerm)) {
			// Continue to ecosystem check
		} else {
			return false;
		}
	}

	// Check if the skill is for an ecosystem the project doesn't use
	for (const [ecosystem, markers] of Object.entries(ECOSYSTEM_MARKERS)) {
		// If any marker appears in the skill ref
		const hasEcosystemMarker = markers.some((marker) => lowerRef.includes(marker));
		if (hasEcosystemMarker) {
			// Check if the project uses this ecosystem
			const projectUsesEcosystem = detectedFrameworks.some(
				(fw) => fw === ecosystem || markers.includes(fw.toLowerCase()),
			);
			if (!projectUsesEcosystem) {
				return false; // Skill is for a different ecosystem
			}
		}
	}

	return true;
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Run 'npx skills find <term>' and parse the results
 * Returns the top relevant result or null if none found
 */
function searchSkills(term: string, detectedFrameworks: string[]): string | null {
	try {
		const output = execSync(`npx skills find ${term}`, {
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
			timeout: 30000,
		});

		// Strip ANSI codes and find lines matching owner/repo@skill pattern
		// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape codes require control chars
		const stripped = output.replace(/\x1b\[[0-9;]*m/g, "");
		const matches = stripped.match(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+@[a-zA-Z0-9_:-]+/gm);

		if (!matches) return null;

		// Find the first result that's actually relevant to the search term and project
		for (const match of matches) {
			if (isRelevantSkill(match, term, detectedFrameworks)) {
				return match;
			}
		}

		return null;
	} catch {
		// Search failed (network error, timeout, etc.)
		return null;
	}
}

/**
 * Parse "owner/repo@skill" into source and skill name
 */
function parseSkillRef(ref: string): { source: string; skill: string } {
	const atIndex = ref.indexOf("@");
	if (atIndex === -1) {
		return { source: ref, skill: "" };
	}
	return {
		source: ref.slice(0, atIndex),
		skill: ref.slice(atIndex + 1),
	};
}

/**
 * Group skill refs by source and dedupe
 */
function groupSkillsBySource(refs: string[]): SkillEntry[] {
	const sourceMap = new Map<string, Set<string>>();

	for (const ref of refs) {
		const { source, skill } = parseSkillRef(ref);
		if (!sourceMap.has(source)) {
			sourceMap.set(source, new Set());
		}
		if (skill) {
			sourceMap.get(source)?.add(skill);
		}
	}

	return Array.from(sourceMap.entries())
		.map(([source, skills]) => ({
			source,
			skills: Array.from(skills).sort(),
		}))
		.sort((a, b) => a.source.localeCompare(b.source));
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const options = parseArgs(args);

	if (options.help) {
		showHelp();
		return;
	}

	if (options.version) {
		showVersion();
		return;
	}

	const cwd = options.cwd ?? process.cwd();

	// Detect project characteristics
	const detected = await detect({ cwd });

	if (options.json && options.skipSearch) {
		// Just output detection results
		console.log(JSON.stringify(detected, null, 2));
		return;
	}

	if (!options.json) {
		console.log("\nProject Analysis\n");

		if (detected.packageManager) {
			console.log(`Pkg Manager: ${detected.packageManager}`);
		}
		if (detected.frameworks.length > 0) {
			console.log(`Frameworks:  ${detected.frameworks.join(", ")}`);
		}
		if (detected.languages.length > 0) {
			console.log(`Languages:   ${detected.languages.join(", ")}`);
		}
		if (detected.tools.length > 0) {
			console.log(`Tools:       ${detected.tools.join(", ")}`);
		}
		if (detected.testing.length > 0) {
			console.log(`Testing:     ${detected.testing.join(", ")}`);
		}

		if (detected.searchTerms.length === 0) {
			console.log("\nNo project characteristics detected.");
			return;
		}

		console.log(`\nSearch terms: ${detected.searchTerms.join(", ")}`);
	}

	if (options.skipSearch) {
		return;
	}

	// Start with curated/official skills based on detected frameworks and tools
	const allSkillRefs: string[] = [];
	const curatedTerms = [...detected.frameworks, ...detected.tools];

	for (const term of curatedTerms) {
		const curated = CURATED_SKILLS[term];
		if (curated) {
			allSkillRefs.push(...curated);
		}
	}

	if (!options.json && allSkillRefs.length > 0) {
		console.log("\nCurated skills:");
		for (const ref of allSkillRefs) {
			console.log(`  ${ref}`);
		}
	}

	// Filter search terms:
	// 1. Skip terms that already have curated skills
	// 2. Skip generic language terms (javascript/typescript) when frameworks are detected
	const curatedTermSet = new Set(Object.keys(CURATED_SKILLS));
	let searchTerms = detected.searchTerms.filter((term) => !curatedTermSet.has(term));

	// If we have frameworks, skip generic language skills (framework skills are better)
	// Also if typescript is detected, skip javascript (typescript is a superset)
	if (detected.frameworks.length > 0) {
		searchTerms = searchTerms.filter((term) => term !== "javascript" && term !== "typescript");
	} else if (searchTerms.includes("typescript")) {
		// No frameworks but has typescript - skip javascript
		searchTerms = searchTerms.filter((term) => term !== "javascript");
	}

	// Search for additional skills
	if (!options.json) {
		console.log("\nSearching for skills (top result per term)...");
	}

	for (const term of searchTerms) {
		if (!options.json) {
			process.stdout.write(`  ${term}...`);
		}
		const topResult = searchSkills(term, detected.frameworks);
		if (topResult) {
			allSkillRefs.push(topResult);
			if (!options.json) {
				console.log(` ${topResult}`);
			}
		} else if (!options.json) {
			console.log(" (none)");
		}
	}

	// Dedupe and group by source
	const uniqueRefs = [...new Set(allSkillRefs)];
	const skills = groupSkillsBySource(uniqueRefs);

	// Build skills.json
	const skillsJson: SkillsJson = {
		$schema: "https://unpkg.com/skillman/skills_schema.json",
		detected: {
			...detected,
			timestamp: new Date().toISOString(),
		},
		skills,
	};

	if (options.json) {
		console.log(JSON.stringify(skillsJson, null, 2));
		return;
	}

	// Write skills.json
	const outputPath = join(cwd, SKILLS_JSON_FILE);
	writeFileSync(outputPath, `${JSON.stringify(skillsJson, null, 2)}\n`);

	console.log(`\nFound ${uniqueRefs.length} skills from ${skills.length} sources`);
	console.log(`Wrote ${outputPath}`);
	console.log("\nInstall with: npx skillman install");
}

main().catch((error) => {
	console.error(`Error: ${error instanceof Error ? error.message : error}`);
	process.exitCode = 1;
});
