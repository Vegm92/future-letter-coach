# FutureLetter AI

FutureLetter AI is a modern, full-stack goal coaching app that empowers users to write letters to their future selves, set and track milestones, and receive personalized motivation—all powered by AI. Built with React, TypeScript, Vite, Supabase, and Tailwind CSS, it delivers a delightful, responsive user experience.

---

## Features

- **Secure Authentication**: Sign up, log in, and manage sessions securely with Supabase Auth.
- **Letter Writing**: Compose and schedule letters to your future self, including goals and personal messages.
- **AI-Powered Suggestions**: Instantly enhance your letters and receive motivational improvements using OpenAI.
- **Milestone Tracking**: Add, edit, and monitor milestones for each letter, with AI-generated suggestions.
- **Progress Visualization**: Track your journey with progress bars and milestone stats.
- **Voice Memos**: Attach audio messages to your letters for a personal touch.
- **Dashboard & Vision Vault**: Manage all your letters and stats in a centralized dashboard and vault.
- **Responsive UI**: Built with shadcn/ui, Radix UI, and Tailwind CSS for accessibility and beauty.
- **Real-Time Notifications**: Get instant feedback and toast notifications for key actions.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI, Recharts
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **AI Integration**: OpenAI API via Supabase Edge Functions
- **State Management**: React Query
- **Tooling**: ESLint, Prettier, Zod, date-fns

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/), [pnpm](https://pnpm.io/), or [yarn](https://yarnpkg.com/)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local backend)

### 1. Clone the Repository

```sh
git clone https://github.com/your-username/future-letter-coach.git
cd future-letter-coach
```

### 2. Install Dependencies

```sh
npm install
# or
yarn install
# or
pnpm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase project credentials and OpenAI API key.

### 4. Run Supabase Locally (Optional)

To start the backend locally:

```sh
supabase start
```

This launches Supabase database, authentication, and Edge Functions locally.

### 5. Start the Development Server

```sh
npm run dev
# or
yarn dev
# or
pnpm dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) (default Vite port).

---

## Project Structure

```
.
├── public/                # Static assets
├── src/
│   ├── components/        # React components (UI, forms, dashboard, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # Supabase and other integrations
│   ├── lib/               # Utility functions and helpers
│   ├── pages/             # Top-level route components
│   ├── services/          # API and business logic
│   ├── types/             # TypeScript types and interfaces
│   └── utils/             # Utility modules
├── supabase/              # Supabase config, migrations, Edge Functions
├── tailwind.config.ts     # Tailwind CSS config
├── vite.config.ts         # Vite config
└── ...
```

---

## Supabase Edge Functions

- **AI Enhancement**: The `supabase/functions/enhance-letter-complete` function integrates with OpenAI to enhance letters and generate milestone suggestions.
- **Setup**: Deploy your Edge Functions to Supabase and ensure your OpenAI API key is set in the environment.

---

## Scripts

- `npm run dev` — Start the Vite development server
- `npm run build` — Build the app for production
- `npm run preview` — Preview the production build
- `npm run lint` — Lint the codebase
- `npm run test` — Run the test suite

## Testing

See [TESTING_GUIDELINES.md](./TESTING_GUIDELINES.md) for our testing philosophy and patterns. Key principles:
- Focus on **interface testing** for hooks
- Use **dynamic dates** to avoid time-dependent failures  
- Keep mocks **simple** and avoid complex dependency mocking

---

## Deployment

- **Frontend**: Deploy the `dist/` folder to your preferred static hosting (Vercel, Netlify, etc.).
- **Supabase**: Deploy your database, storage, and Edge Functions to your Supabase project.
- **Environment**: Set environment variables for Supabase and OpenAI in your hosting provider.

---

## Contributing

Pull requests and issues are welcome! Please open an issue to discuss your idea or bug before submitting a PR.

---

## License

MIT

---

## Acknowledgements

- [Supabase](https://supabase.com/)
- [OpenAI](https://openai.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
