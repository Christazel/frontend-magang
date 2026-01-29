## 📁 Project Structure Documentation

### Folder Organization

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page
│   ├── providers.tsx      # Global providers (Auth, Toast)
│   ├── (auth)/            # Auth route group
│   │   ├── login/         # Login page
│   │   └── register/      # Register page
│   └── (dashboard)/       # Dashboard route group
│       └── dashboard/     # Dashboard pages
│
├── components/            # Reusable React components
│   └── layout/           # Layout components
│       ├── Navbar.tsx    # Top navigation bar
│       ├── Sidebar.tsx   # Sidebar navigation
│       └── Footer.tsx    # Footer component
│
├── context/              # React Context for state management
│   └── AuthContext.tsx   # Authentication context & provider
│
├── hooks/                # Custom React hooks
│   └── useAuth.ts        # Hook to use auth context
│
├── lib/                  # Utility functions & libraries
│   ├── api.ts           # API service functions
│   └── utils.ts         # Helper utility functions
│
├── constants/            # Application constants
│   └── menu.ts          # Menu configuration & items
│
├── types/               # TypeScript type definitions
│   └── index.ts         # Global types & interfaces
│
└── styles/              # Global stylesheets
    └── globals.css      # Global CSS styles
```

### Key Files & Their Purposes

#### Context
- **AuthContext.tsx**: Manages user authentication state, login/logout logic, and token handling

#### API Services
- **api.ts**: Centralized API calls with proper error handling
- **Includes**: loginUser(), apiCall() for making authenticated requests

#### Type Definitions
- **types/index.ts**: Global TypeScript interfaces and enums (User, AuthContextType, MenuItem, etc.)

#### Constants
- **constants/menu.ts**: Menu items configuration for admin and peserta roles

#### Utilities
- **lib/utils.ts**: Helper functions for validation, formatting, string manipulation, etc.

#### Components
- **Sidebar.tsx**: Dynamic sidebar with role-based menu items
- **Navbar.tsx**: Fixed top navbar
- **Footer.tsx**: Footer component

### How to Add New Features

1. **New API Endpoint**: Add function to `src/lib/api.ts`
2. **New Type**: Add interface to `src/types/index.ts`
3. **New Component**: Create in `src/components/` with proper folder structure
4. **New Page**: Create in `src/app/` following Next.js routing conventions
5. **New Utility**: Add function to `src/lib/utils.ts`

### Best Practices

- ✅ Always use TypeScript types from `@/types`
- ✅ Import utilities from `@/lib`
- ✅ Use constants from `@/constants` instead of hardcoding values
- ✅ Handle errors properly with try-catch blocks
- ✅ Use toast notifications for user feedback
- ✅ Add JSDoc comments for functions
- ✅ Keep components focused and reusable
- ✅ Use path aliases (@/) for cleaner imports

### Environment Variables

Create `.env.local` file in root directory with:
```
NEXT_PUBLIC_API_URL=your_api_url
```

### Running the Project

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Linting
npm run lint
```
