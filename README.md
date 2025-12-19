# Fitness Guru AI

An AI-powered fitness planning application that creates personalized workout and nutrition plans through an interactive chat interface. Built with React, Express.js, and OpenAI.

## 🏗️ Project Structure

This is a [Turborepo](https://turborepo.org) monorepo containing the following apps:

### Apps

- **`apps/web`**: React frontend application built with Vite
  - Interactive chat interface for collecting user fitness goals
  - Plan viewing and management
  - Modern UI with Tailwind CSS and Radix UI components
  - Dark mode support

- **`apps/api`**: Express.js backend API
  - RESTful API endpoints for chat interactions
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

Create a `.env` file in `apps/api/` with the following variables:
```env
# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# SendGrid (optional)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_email@example.com

# Server
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
```

### Development

To run all apps in development mode:

```bash
npm run dev
```

This will start:
- Frontend at `http://localhost:5173`
- Backend API at `http://localhost:3000`

To run a specific app:

```bash
# Frontend only
npm run dev --filter=web

# Backend only
npm run dev --filter=api
```

### Build

To build all apps and packages:

```bash
npm run build
```

To build a specific app:

```bash
npm run build --filter=web
npm run build --filter=api
```

## 📦 Tech Stack

### Frontend (`apps/web`)
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **next-themes** - Theme management (dark mode)

### Backend (`apps/api`)
- **Express.js** - Web framework
- **OpenAI** - AI plan generation
- **MySQL2** - Database driver
- **SendGrid** - Email delivery
- **Zod** - Schema validation
- **CORS** - Cross-origin resource sharing

### Monorepo Tools
- **Turborepo** - Build system and task runner
- **TypeScript** - Type checking
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🎯 Features

- **Interactive Chat Interface**: Conversational flow to collect user fitness goals, preferences, and constraints
- **AI-Powered Plan Generation**: Personalized workout and nutrition plans generated using OpenAI
- **Session Management**: Persistent sessions to maintain conversation context
- **Plan Viewing**: View and manage generated fitness plans
- **Email Delivery**: Send fitness plans via email (optional)
- **Responsive Design**: Modern, mobile-friendly UI with dark mode support

## 📝 Available Scripts

From the root directory:

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all apps
- `npm run lint` - Lint all apps
- `npm run format` - Format code with Prettier
- `npm run check-types` - Type check all apps

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
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Express.js Documentation](https://expressjs.com)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[Add your license here]
