# Resido Next.js

Resido is implemented as a native Next.js App Router site using React and TypeScript. Pages are rendered from the route modules in `app/`, shared interface elements live in `src/components/`, and the site styles are maintained in `app/globals.css`.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Project structure

- `app/`: App Router layout, route pages, not-found page, and global styles.
- `src/components/`: reusable navigation, property, search, dashboard, and page components.
- `src/data/`: typed sample property, agent, and article data.
- `public/assets/img/`: static images, icons, and video served by Next.js.
- `next.config.ts`: Next.js configuration.

The site currently uses sample data and local UI state. It does not include a backend for accounts, listings, payments, or file uploads. Map interfaces are placeholders until a map provider and API key are configured.
