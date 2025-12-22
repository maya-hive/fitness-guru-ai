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
  - MySQL database integration

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 11.6.2
- MySQL database
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
# Database Configuration
# Option 1: Direct Connection (no SSH)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Option 2: Remote MySQL via SSH Tunnel
# Set DB_USE_SSH=true to enable SSH tunneling
DB_USE_SSH=true
DB_SSH_HOST=your-ssh-server.com
DB_SSH_PORT=22
DB_SSH_USER=ssh_username

# Authentication Method 1: Password
DB_SSH_PASSWORD=ssh_password

# Authentication Method 2: Private Key from File Path (recommended)
# Windows: DB_SSH_PRIVATE_KEY_PATH=C:\Users\Admin\.ssh\id_rsa
# Linux/Mac: DB_SSH_PRIVATE_KEY_PATH=/home/user/.ssh/id_rsa
# Or use ~ for home directory: DB_SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa
# DB_SSH_PASSPHRASE=optional_passphrase_if_key_is_encrypted

# Authentication Method 3: Private Key from Environment Variable
# DB_SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----
# OR base64 encoded:
# DB_SSH_PRIVATE_KEY=<base64_encoded_key>
# DB_SSH_PASSPHRASE=optional_passphrase

# Remote MySQL host (accessible from SSH server)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

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
- **MySQL2** - Database driver
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
- **Session Management**: In-memory session management with database persistence for plans
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
