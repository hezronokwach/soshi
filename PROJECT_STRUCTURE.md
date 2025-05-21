# Soshi Project Structure

This document provides an overview of the Soshi project structure, explaining the purpose of key directories and files to help team members navigate and understand the codebase.

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Key Files](#key-files)
4. [Authentication Flow](#authentication-flow)
5. [Routing and Layouts](#routing-and-layouts)
6. [Database](#database)
7. [Components](#components)
8. [Styling](#styling)
9. [Development Workflow](#development-workflow)

## Overview

Soshi is a modern social network application built with Next.js. The application follows a clean architecture with:

- Next.js App Router for page routing
- SQLite database for data storage
- Authentication with session-based auth
- Tailwind CSS for styling
- React components for UI

## Directory Structure

```
soshi/
├── public/               # Static assets
├── src/                  # Source code
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── feed/         # Feed page with layout
│   │   ├── login/        # Login page with layout
│   │   ├── register/     # Register page with layout
│   │   ├── profile/      # Profile page
│   │   ├── posts/        # Posts page
│   │   ├── groups/       # Groups page
│   │   ├── chat/         # Chat page
│   │   ├── notifications/# Notifications page
│   │   ├── layout.js     # Root layout
│   │   └── page.js       # Root page (redirects to /feed)
│   ├── components/       # Reusable React components
│   │   ├── auth/         # Authentication components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and libraries
│   │   └── db/           # Database utilities
│   └── middleware.js     # Next.js middleware for route protection
├── .next/                # Next.js build output (generated)
├── node_modules/         # Node.js dependencies (generated)
├── package.json          # Project dependencies and scripts
├── next.config.js        # Next.js configuration
└── tailwind.config.js    # Tailwind CSS configuration
```

## Key Files

### Root Configuration

- **package.json**: Defines project dependencies and npm scripts
- **next.config.js**: Configuration for Next.js
- **tailwind.config.js**: Configuration for Tailwind CSS
- **jsconfig.json**: JavaScript configuration for the project

### App Structure

- **src/app/layout.js**: Root layout that wraps all pages
- **src/app/page.js**: Root page that redirects to /feed
- **src/middleware.js**: Handles route protection and redirects

### Page Layouts

- **src/app/login/layout.js**: Layout for login page (no navbar/sidebars)
- **src/app/register/layout.js**: Layout for register page (no navbar/sidebars)
- **src/app/feed/layout.js**: Layout for feed page (with navbar/sidebars)

### Authentication

- **src/hooks/useAuth.js**: Authentication hook for login, register, logout
- **src/app/api/auth/**: API routes for authentication
  - **login/route.js**: Handles user login
  - **register/route.js**: Handles user registration
  - **logout/route.js**: Handles user logout
  - **session/route.js**: Provides current user session

### Components

- **src/components/layout/Layout.jsx**: Main layout with navbar, sidebars, footer
- **src/components/layout/Navbar.jsx**: Navigation bar component
- **src/components/layout/LeftSidebar.jsx**: Left sidebar for navigation
- **src/components/layout/RightSidebar.jsx**: Right sidebar for users and groups
- **src/components/layout/Footer.jsx**: Footer component
- **src/components/auth/LoginForm.jsx**: Login form component
- **src/components/auth/RegisterForm.jsx**: Registration form component

## Authentication Flow

1. **Registration**: Users register via `/register` page
   - Form data is validated and sent to `/api/auth/register`
   - Password is hashed and user is created in the database
   - Session token is created and stored in cookies
   - User is redirected to `/feed`

2. **Login**: Users login via `/login` page
   - Credentials are validated against the database
   - Session token is created and stored in cookies
   - User is redirected to `/feed`

3. **Session Management**: 
   - Session tokens are stored in cookies
   - Middleware checks for valid session on protected routes
   - Unauthenticated users are redirected to `/login`

4. **Logout**: 
   - Session token is removed from cookies
   - User is redirected to `/login`

## Routing and Layouts

The application uses a simple routing structure:

- **Public Routes**: `/login`, `/register`
  - These pages use a clean layout without navbar or sidebars
  - Accessible to unauthenticated users

- **Protected Routes**: `/feed`, `/profile`, etc.
  - These pages use the main layout with navbar, sidebars, and footer
  - Require authentication to access
  - Unauthenticated users are redirected to `/login`

- **Root Route**: `/`
  - Redirects to `/feed`

## Database

The application uses SQLite for data storage:

- **soshi.db**: SQLite database file
- **src/lib/db/sqlite.js**: Database connection and utility functions
- **src/lib/db/migrations/**: Database migration files

## Components

Components are organized by function:

- **Layout Components**: Components for page structure
- **Auth Components**: Components for authentication
- **UI Components**: Reusable UI elements

## Styling

The application uses Tailwind CSS for styling:

- **tailwind.config.js**: Tailwind configuration
- **src/app/globals.css**: Global CSS styles
- **Component-level styles**: Inline styles using Tailwind classes

## Development Workflow

1. **Start Development Server**:
   ```
   npm run dev:webpack
   ```
   or with Turbopack (faster but may have issues):
   ```
   npm run dev
   ```

2. **Build for Production**:
   ```
   npm run build
   ```

3. **Start Production Server**:
   ```
   npm run start
   ```

4. **Linting**:
   ```
   npm run lint
   ```
