#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { detect } from "./index.js";

const OUTPUT_FILE = ".skills-detector.json";

interface CliOptions {
	cwd?: string;
	output?: string;
	json?: boolean;
	help?: boolean;
	version?: boolean;
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
		} else if (arg === "--output" || arg === "-o") {
			options.output = args[++i];
		} else if (arg === "--cwd" || arg === "-C") {
			options.cwd = args[++i];
		}
	}

	return options;
}

function showHelp(): void {
	console.log(`
skills-detector - Detect project characteristics for skill recommendations

Usage: skills-detector [options]

Options:
  -h, --help       Show this help message
  -v, --version    Show version number
  --json           Output only JSON (no other text)
  -o, --output     Output file path (default: ${OUTPUT_FILE})
  -C, --cwd        Working directory to analyze (default: current directory)

Examples:
  $ skills-detector                    # Analyze current directory
  $ skills-detector --json             # Output JSON only
  $ skills-detector -o project.json    # Custom output file
  $ skills-detector -C ./my-project    # Analyze specific directory

Output Format:
  {
    "frameworks": ["nextjs", "react"],
    "languages": ["typescript"],
    "tools": ["prisma", "tailwind"],
    "testing": ["vitest", "playwright"],
    "searchTerms": ["nextjs", "prisma", "react", ...]
  }

Use searchTerms with 'npx skills find <term>' to discover relevant skills.
`);
}

function showVersion(): void {
	// In a real build, this would come from package.json
	console.log("skills-detector 0.0.1");
}

function main(): void {
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
	const outputPath = options.output ?? join(cwd, OUTPUT_FILE);

	// Detect project characteristics
	const result = detect({ cwd });

	// Output JSON
	const jsonOutput = JSON.stringify(result, null, 2);

	if (options.json) {
		// JSON-only mode
		console.log(jsonOutput);
	} else {
		// Human-friendly output
		console.log("\nProject Analysis\n");

		if (result.frameworks.length > 0) {
			console.log(`Frameworks:  ${result.frameworks.join(", ")}`);
		}
		if (result.languages.length > 0) {
			console.log(`Languages:   ${result.languages.join(", ")}`);
		}
		if (result.tools.length > 0) {
			console.log(`Tools:       ${result.tools.join(", ")}`);
		}
		if (result.testing.length > 0) {
			console.log(`Testing:     ${result.testing.join(", ")}`);
		}

		if (result.searchTerms.length === 0) {
			console.log("\nNo project characteristics detected.");
		} else {
			console.log(`\nSearch terms: ${result.searchTerms.join(", ")}`);

			// Write output file
			writeFileSync(outputPath, `${jsonOutput}\n`);
			console.log(`\nWrote ${outputPath}`);

			// Suggest skill search commands
			console.log("\nFind relevant skills:");
			const topTerms = result.searchTerms.slice(0, 5);
			for (const term of topTerms) {
				console.log(`  npx skills find ${term}`);
			}
		}
	}
}

main();
