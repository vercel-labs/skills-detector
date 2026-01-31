# skills-detector

Detect project characteristics and find matching [agent skills](https://skills.sh).

## Installation

```bash
npm install -g skills-detector
```

## Usage

```bash
# Analyze project and search for matching skills
skills-detector

# Detection only (no skill search)
skills-detector --skip-search

# Output JSON to stdout
skills-detector --json

# Analyze a specific directory
skills-detector -C ./my-project
```

## What it does

1. **Detects** your project's frameworks, languages, tools, and testing setup
2. **Searches** skills.sh for matching skills using each detected term
3. **Writes** `skills.json` with results, compatible with [skillman](https://github.com/pi0/skillman)

## Output

Running `skills-detector` creates a `skills.json`:

```json
{
  "$schema": "https://unpkg.com/skillman/skills_schema.json",
  "detected": {
    "frameworks": ["nextjs", "react"],
    "languages": ["typescript"],
    "tools": ["prisma", "tailwind"],
    "testing": ["vitest"],
    "searchTerms": ["nextjs", "prisma", "react", ...],
    "timestamp": "2025-01-31T12:00:00.000Z"
  },
  "skills": [
    { "source": "vercel-labs/agent-skills", "skills": ["vercel-react-best-practices"] },
    { "source": "wshobson/agents", "skills": ["nextjs-app-router-patterns"] }
  ]
}
```

Then install with skillman:

```bash
npx skillman install
```

## Programmatic API

```typescript
import { detect } from 'skills-detector'

const result = detect({ cwd: './my-project' })
// {
//   frameworks: ['nextjs', 'react'],
//   languages: ['typescript'],
//   tools: ['prisma'],
//   testing: ['vitest'],
//   searchTerms: ['nextjs', 'prisma', 'react', ...]
// }
```

## Supported Detection

### Frameworks

- **JavaScript/TypeScript**: Next.js, Remix, Astro, Nuxt, SvelteKit, Vue, Angular, Gatsby, Vite, Express, Fastify, Hono, Elysia, NestJS, React
- **Python**: Django, Flask, FastAPI
- **Ruby**: Rails, Sinatra
- **Go**: Gin, Echo, Fiber
- **Rust**: Actix, Axum, Rocket
- **Java/Kotlin**: Spring

### Languages

TypeScript, JavaScript, Python, Ruby, Go, Rust, Java, Kotlin, Swift, PHP, C#, Elixir, Scala, Clojure, Haskell, Zig

### Tools

- **ORMs**: Prisma, Drizzle, TypeORM, Sequelize, Mongoose, Kysely
- **Styling**: Tailwind, Styled Components, Emotion, Sass, Less
- **Build**: Webpack, esbuild, Rollup, Turborepo
- **State**: Redux, Zustand, Jotai, Recoil, MobX
- **API**: GraphQL, tRPC, TanStack Query, SWR, Axios
- **Auth**: NextAuth, Clerk, Auth0, Supabase, Firebase
- **DevOps**: Docker, Kubernetes, Terraform, Pulumi
- **Linting**: ESLint, Prettier, Biome
- **Monorepo**: Nx, Lerna, Changesets
- **Docs**: Storybook, Docusaurus
- **AI**: OpenAI, Anthropic, LangChain, Vercel AI SDK

### Testing

- **Unit**: Vitest, Jest, Mocha, Ava, Tap
- **E2E**: Playwright, Cypress, Puppeteer, Selenium
- **Component**: Testing Library, Enzyme
- **Python**: pytest
- **Ruby**: RSpec, Minitest

## License

MIT
