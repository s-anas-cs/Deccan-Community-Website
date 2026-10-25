# Deccan Community Website + Admin Panel

This package keeps the existing Deccan Community public website and adds a secure admin panel for the four requested areas: images, services, contact details and events. Content is stored in `content.json` in GitHub; no external database is used. When an admin saves a change, the server-side Vercel API commits it to the configured GitHub branch, which should trigger a Vercel redeployment.

## Important before deploying

- Merge these files into the **same GitHub repository and branch that Vercel currently deploys**. Do not delete existing image assets (for example `logo.jpeg`, `ceo.jpeg`, `h.jpeg`, `ed.jpeg`, `sw.jpeg`, and the gallery images); they were referenced by the supplied HTML but were not included in the uploaded files. If those files are not already in your repository, upload the real images too.
- The public website is `index.html`; the admin page is `/admin.html`.
- The admin panel only manages images, services, contact details and events. The membership and payment HTML pages are retained as supplied; this package does not create a membership database, payment processor, or secure storage for submitted membership/payment records.

## Configure Vercel environment variables

In Vercel, open the project → **Settings → Environment Variables** and add these variables for Production (and Preview if you want to test previews):

| Variable | Value |
| --- | --- |
| `GITHUB_OWNER` | GitHub account or organization that owns the repo |
| `GITHUB_REPO` | Repository name only, without owner or URL |
| `GITHUB_BRANCH` | The branch connected to Vercel, usually `main` |
| `GITHUB_TOKEN` | Fine-grained GitHub token with **Contents: Read and write** permission for this repository |
| `ADMIN_USERNAME` | Your chosen admin username (optional; defaults to `admin`) |
| `ADMIN_PASSWORD` | A long, unique password that you do not use elsewhere |
| `SESSION_SECRET` | A random secret with at least 32 characters |

Keep `GITHUB_TOKEN`, `ADMIN_PASSWORD`, and `SESSION_SECRET` only in Vercel environment variables. **Never put them in `admin.html`, `app.js`, GitHub commits, screenshots, or messages.** After adding/changing environment variables, redeploy the Vercel project.

Example `SESSION_SECRET` generation (run on your own computer):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Admin usage

1. Open `https://YOUR-VERCEL-DOMAIN/admin.html`.
2. Sign in using `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
3. Use Contact details, Website images, Services or Events.
4. Save. The server commits `content.json` or uploaded images to the configured GitHub branch. Vercel starts a deployment automatically; allow it to finish before expecting the public site to show the update.
5. Uploaded images are stored under `uploads/` and their paths are written into `content.json`.

## API routes

- `POST /api/admin/login` — creates an HTTP-only signed session cookie.
- `POST /api/admin/logout` — ends the session.
- `GET /api/admin/content` — reads the current GitHub content file for an authenticated admin.
- `POST /api/admin/content` — commits content changes to GitHub.
- `POST /api/admin/upload` — uploads a supported image to GitHub (JPG, PNG, WEBP or GIF; maximum 3 MB).

The `content.json` file is public website content and is intentionally public. Do not store passwords, private member details, or payment details in it.

## Deployment checklist

- [ ] Files merged into the current Vercel-connected GitHub repository.
- [ ] Existing site image assets preserved.
- [ ] Vercel environment variables configured.
- [ ] New deployment completed successfully.
- [ ] `/` loads the public site.
- [ ] `/admin.html` accepts the configured credentials.
- [ ] Test a harmless service/contact change and verify the GitHub commit + Vercel deployment.

If the GitHub repository is private, the token must have access to that exact repository. If the branch name is not `main`, set `GITHUB_BRANCH` to the actual deployment branch.
