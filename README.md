# Fitness Guru AI

An AI-powered fitness planning application that creates personalized workout and nutrition plans through an interactive chat interface. Built with Next.js and OpenAI.

## 🏗️ Project Structure

This is a [Turborepo](https://turborepo.org) monorepo containing the following apps:

### Apps

- **`apps/web`**: Next.js full-stack application
  - Interactive chat interface for collecting user fitness goals
  - Plan viewing and management
  - Modern UI with Tailwind CSS and Radix UI components
  - Dark mode support
  - Next.js API routes for backend functionality
  - OpenAI integration for generating personalized fitness plans
  - Session management
  - Email delivery via SendGrid
  - Supabase database integration

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 11.6.2
- Supabase account and project
- OpenAI API key
- SendGrid API key (optional, for email functionality)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fitness-guru-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:
```env
# Supabase Configuration
# Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# Use service role key for server-side operations (bypasses RLS)
# Get this from Supabase project settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# SendGrid (optional)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_email@example.com
EMAIL_FROM=your_email@example.com

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:3000

# OpenAI Model (optional, defaults to gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

4. Set up Supabase database:

   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Go to the SQL Editor in your Supabase dashboard
   - Run the following SQL to create the required table:

```sql
-- Table schema with UUID primary key and JSONB for chat_history
CREATE TABLE IF NOT EXISTS fitness_sessions (
    session_id UUID NOT NULL DEFAULT gen_random_uuid(),
    goal VARCHAR(100),
    age INTEGER,
    weight NUMERIC(5,2),
    height NUMERIC(5,2),
    weekly_hours NUMERIC(4,2),
    equipment TEXT,
    chat_history JSONB,
    plan_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fitness_sessions_pkey PRIMARY KEY (session_id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS update_fitness_sessions_updated_at ON fitness_sessions;

CREATE TRIGGER update_fitness_sessions_updated_at BEFORE UPDATE
ON fitness_sessions FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Note:** The `session_id` uses UUID type. The application generates UUIDs using Node.js `crypto.randomUUID()`. The `chat_history` column uses JSONB type for better JSON handling in PostgreSQL.

### Development

To run the Next.js application in development mode:

```bash
npm run dev
```

Or run it directly:

```bash
npm run dev --filter=web
```

This will start:
- Next.js application at `http://localhost:3000` (includes both frontend and API routes)

### Build

To build all apps and packages:

```bash
npm run build
```

To build the Next.js app:

```bash
npm run build --filter=web
```

## 📦 Tech Stack

### Frontend & Backend (`apps/web`)
- **Next.js 15** - Full-stack React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **next-themes** - Theme management (dark mode)
- **OpenAI** - AI plan generation
- **@supabase/supabase-js** - Supabase client library
- **SendGrid** - Email delivery
- **Zod** - Schema validation

### Monorepo Tools
- **Turborepo** - Build system and task runner
- **TypeScript** - Type checking (optional, project uses JavaScript)
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🎯 Features

- **Interactive Chat Interface**: Conversational flow to collect user fitness goals, preferences, and constraints
- **AI-Powered Plan Generation**: Personalized workout and nutrition plans generated using OpenAI
- **Session Management**: In-memory session management with Supabase database persistence for plans
- **Plan Viewing**: View and manage generated fitness plans via shareable links
- **Email Delivery**: Send fitness plans via email using SendGrid (optional)
- **Responsive Design**: Modern, mobile-friendly UI with dark mode support
- **Full-Stack Integration**: Unified Next.js application with API routes and server-side rendering

## 📝 Available Scripts

From the root directory:

- `npm run dev` - Start Next.js app in development mode
- `npm run build` - Build Next.js app for production
- `npm run lint` - Lint all apps
- `npm run format` - Format code with Prettier
- `npm run check-types` - Type check all apps

From the `apps/web` directory:

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server (after build)
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Turborepo

The project uses Turborepo for managing the monorepo. Configuration is in `turbo.json`.

### Remote Caching

Turborepo supports remote caching to share build artifacts across machines. To enable:

```bash
# Login to Vercel
turbo login

# Link your repository
turbo link
```

## 📚 Learn More

- [Turborepo Documentation](https://turborepo.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[Add your license here]
