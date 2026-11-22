# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Serve the production site with prerendered pages

`npm run build` generates `dist/index.html`, one HTML file per public marketing route, and `dist/sitemap.xml`. It also generates separate SPA shells for the account routes and dynamic public pages. Upload the entire `dist` directory, including the `features/` and `terms/` subdirectories.

On the VPS, use `deploy/nginx/churchcentral-public.conf` in the Nginx server block for `churchcentral.church`. It replaces the current blanket SPA fallback. Keep the existing document root, TLS, API proxy, and asset locations. Run `sudo nginx -t` before reloading Nginx.

Keep the wildcard tenant server separate from the marketing routes. If it shares the same document root, use `try_files $uri /app.html;` for tenant paths and `try_files /app.html =404;` in its exact `location = /`.

After deployment, confirm `/`, `/pricing` and `/features/discipleship` each return their own canonical and heading in the raw HTML. Confirm an unknown path returns HTTP 404 and `/login` sends `noindex`. Submit the generated sitemap in Google Search Console. In Cloudflare, verify Googlebot and AI search crawlers such as OAI-SearchBot can fetch the public pages. Cloudflare's edge policy is managed separately from this repository.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
