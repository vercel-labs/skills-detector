#!/usr/bin/env node

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { detect } from "./index.js";
import type { DetectionResult } from "./types.js";

const SKILLS_JSON_FILE = "skills.json";

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

/**
 * Run 'npx skills find <term>' and parse the results
 * Returns the top result (first match) or null if none found
 */
function searchSkills(term: string): string | null {
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
		// Return only the top result (first on leaderboard)
		return matches?.[0] ?? null;
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
	const detected = detect({ cwd });

	if (options.json && options.skipSearch) {
		// Just output detection results
		console.log(JSON.stringify(detected, null, 2));
		return;
	}

	if (!options.json) {
		console.log("\nProject Analysis\n");

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

	// Search for skills
	if (!options.json) {
		console.log("\nSearching for skills (top result per term)...");
	}

	const allSkillRefs: string[] = [];

	for (const term of detected.searchTerms) {
		if (!options.json) {
			process.stdout.write(`  ${term}...`);
		}
		const topResult = searchSkills(term);
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
