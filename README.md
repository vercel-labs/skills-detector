# skills-detector

Detect project characteristics to recommend [agent skills](https://skills.sh).

## Installation

```bash
npm install skills-detector
```

## Usage

### CLI

```bash
# Analyze current directory
npx skills-detector

# Output JSON only
npx skills-detector --json

# Analyze a specific directory
npx skills-detector -C ./my-project
```

### Programmatic

```typescript
import { detect } from 'skills-detector'

const result = detect()
// or with custom directory
const result = detect({ cwd: './my-project' })

console.log(result)
// {
//   frameworks: ['nextjs', 'react'],
//   languages: ['typescript'],
//   tools: ['prisma', 'tailwind'],
//   testing: ['vitest', 'playwright'],
//   searchTerms: ['nextjs', 'prisma', 'react', ...]
// }
```

## Output Format

The detection result includes:

- **frameworks**: Detected frameworks (e.g., `nextjs`, `remix`, `rails`, `django`)
- **languages**: Detected programming languages (e.g., `typescript`, `python`, `go`)
- **tools**: Detected tools and libraries (e.g., `prisma`, `tailwind`, `docker`)
- **testing**: Detected testing frameworks (e.g., `vitest`, `jest`, `playwright`)
- **searchTerms**: Combined list of all detected items for skill discovery

## Finding Skills

Use the `searchTerms` to find relevant skills:

```bash
npx skills find nextjs
npx skills find prisma
npx skills find tailwind
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
