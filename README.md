# Inovoid — Technical Blogging Platform

A modern, full-stack technical blogging platform built with **HTML/CSS/JS + Tailwind CSS + Supabase**.

## Features

- 🔐 **Authentication** — Signup with email verification, login, password reset
- 📝 **Blog Posts** — Create, edit, publish with rich text editor and cover images
- 💬 **Comments** — Real-time discussion on every post
- ❤️ **Reactions** — Like, love, and fire reactions
- 👤 **Profiles** — Avatar, bio, nickname, published posts
- ⚙️ **Settings** — Password change, privacy controls
- 🌗 **Themes** — Dark and light mode with persistence
- 📱 **Responsive** — Mobile-first design with bottom nav

## Project Structure.

```
techBlog/
├── .env                        # Supabase credentials (not committed)
├── .gitignore
├── README.md
├── docs/
│   └── schema.sql              # Database schema (run in Supabase SQL Editor)
├── stitch_assets/              # Original design references
└── web/                        # Deployable static site
    ├── index.html              # Landing page
    ├── pages/
    │   ├── signup.html         # User registration
    │   ├── login.html          # User login
    │   ├── feed.html           # Blog feed dashboard
    │   ├── post.html           # Single post view
    │   ├── create.html         # Create/edit posts
    │   ├── profile.html        # User profile
    │   └── settings.html       # Account settings
    ├── css/
    │   └── main.css            # Shared custom styles
    ├── js/
    │   ├── config.js           # Supabase credentials (not committed)
    │   ├── supabase.js         # Database client & helpers
    │   ├── auth.js             # Auth guards & utilities
    │   └── theme.js            # Dark/light theme toggle
    └── assets/
        ├── favicon.svg
        └── images/
```

## Quick Start

1. **Create Supabase project** at [supabase.com](https://supabase.com)
2. **Run schema** — paste `docs/schema.sql` into Supabase SQL Editor
3. **Add credentials** — update `web/js/config.js` with your Supabase URL & anon key
4. **Serve locally:**
   ```bash
   cd web
   npx -y serve . -l 3000
   ```
5. Open http://localhost:3000

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| HTML5 / CSS3 / JS | Frontend |
| Tailwind CSS (CDN) | Utility-first styling |
| Supabase | Auth, Database, Storage |
| Space Grotesk | Typography |
| Material Icons | Iconography |

## License

© 2025 inovoid. All rights reserved.
