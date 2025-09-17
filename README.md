# Recruitment Admin Dashboard

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). It serves as an admin dashboard for a recruitment process, built with Next.js, TypeScript, and Supabase.

## Getting Started

First, you need to set up your environment variables. Create a file named `.env.local` in the root of the project and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Next, install the dependencies and run the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

Here's an overview of the key files and directories:

```text
.
├── src/
│   ├── app/
│   │   ├── (pages)/                # Each folder is a route in the app
│   │   │   ├── [slug]/page.tsx     # Dynamic pages
│   │   │   └── page.tsx            # Static pages
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Main app layout
│   │   ├── page.tsx                # The main dashboard homepage
│   │   └── utils/
│   │       └── supabase/           # Supabase client/server setup
│   │           ├── client.ts       # Supabase client for browser
│   │           ├── middleware.ts   # Supabase middleware
│   │           └── server.ts       # Supabase client for server
│   ├── components/                 # Reusable React components
│   └── lib/                        # Library/utility functions
├── next.config.ts                  # Next.js configuration
├── package.json                    # Project dependencies and scripts
└── tsconfig.json                   # TypeScript configuration
```

- **`src/app`**: Contains all the application's routes and pages, following the Next.js App Router structure.
- **`src/app/utils/supabase`**: This is the core of the backend integration. It contains the logic for creating Supabase clients on both the client and server side.
- **`src/components`**: For reusable UI components used across different pages (e.g., ThemeProvider).
- **`src/lib`**: Contains shared utility functions.

## Customization

### Styling

- **Global Styles**: Edit `src/app/globals.css` for sitewide styles.
- **Tailwind CSS**: The project uses Tailwind CSS for utility-first styling. You can customize the theme by creating a `tailwind.config.ts` file.
- **UI Components**: The project uses `shadcn/ui`. You can add new components or modify existing ones in the `src/components` directory.

### Pages and Routes

- To **edit a page**, navigate to the corresponding folder in `src/app` and modify the `page.tsx` file. For example, to edit the "All Users" page, you would edit `src/app/users/page.tsx`.
- To **add a new page**, create a new folder in `src/app` and add a `page.tsx` file inside it.

### Backend Logic (Supabase)

The application is tightly integrated with Supabase for database operations and authentication.

- **Data Fetching**: Data fetching logic is located directly within the page components that need it. For example, `src/app/users/page.tsx` contains the `fetchUsers` function which queries the Supabase `users` table.
- **Supabase Client**: The Supabase client instances are created in `src/app/utils/supabase/`. If you need to change how the client is configured, this is the place to do it.

## Changing the Backend

If you want to replace Supabase with a custom backend (e.g., your own REST or GraphQL API), you'll need to follow these steps:

1. **Remove Supabase Packages**:
   You can remove the Supabase dependencies from your `package.json`:

   ```bash
   pnpm remove @supabase/ssr @supabase/supabase-js
   ```

2. **Create API Routes (Optional but Recommended)**:
   With Next.js, you can create your own API endpoints inside `src/app/api`. For example, you could create `src/app/api/users/route.ts` to handle fetching users.

   ```typescript
   // src/app/api/users/route.ts
   import { NextResponse } from "next/server";

   export async function GET() {
     // Your custom logic to fetch users from your database
     const users = await myDatabase.query("SELECT * FROM users");
     return NextResponse.json(users);
   }
   ```

3. **Update Data Fetching Logic**:
   Go through each page file (`page.tsx`) and replace the Supabase-specific data fetching code with calls to your new backend or API routes.

   **Before (with Supabase):**

   ```typescript
   // src/app/users/page.tsx
   import { createClient } from "../utils/supabase/client";

   const fetchUsers = async () => {
     const supabase = createClient();
     const { data, error } = await supabase.from("users").select("*");
     if (error) throw error;
     return data;
   };
   ```

   **After (with a custom backend API route):**

   ```typescript
   // src/app/users/page.tsx

   const fetchUsers = async () => {
     const response = await fetch("/api/users");
     if (!response.ok) {
       throw new Error("Failed to fetch users");
     }
     const data = await response.json();
     return data;
   };
   ```

4. **Handle Authentication**:
   If you were using Supabase for authentication, you will need to implement your own authentication system. This will involve:
   - Creating login/logout API endpoints.
   - Managing user sessions (e.g., with JWTs and cookies).
   - Protecting routes and pages based on authentication status. You might need to create your own middleware to replace `src/app/utils/supabase/middleware.ts`.

By following these steps, you can adapt the dashboard to work with any backend you choose.

> Docs generated by [Gemini 2.5 Pro](https://gemini.google.com/). Correct, verified by me.
