# MySite-The-New-One

Personal portfolio site with a built-in, single-admin CMS powered by SvelteKit 2, Svelte 5, Tailwind CSS 4, Node.js 24, `@sveltejs/adapter-node`, and `better-sqlite3`.

---

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Running with Podman (Local Container)

### Prerequisites

- [Podman](https://podman.io/) installed.
- Optional: `podman-compose` installed.

### Option A: Using npm & Podman Compose (Recommended)

1. **Configure Environment**:
   Ensure `.env` exists (copy from `.env.example` if needed):

   ```bash
   cp -n .env.example .env
   ```

2. **Build and Launch Container**:

   ```bash
   npm run podman:up
   ```

   _Alternatively_: `podman-compose up --build -d`

3. **Access the Application in Your Web Browser**:
   - **Public Site**: [http://localhost:6941](http://localhost:6941)
   - **First-Time Admin Setup**: [http://localhost:6941/admin/setup](http://localhost:6941/admin/setup)
   - **Admin Dashboard**: [http://localhost:6941/admin](http://localhost:6941/admin)

4. **View Logs**:

   ```bash
   npm run podman:logs
   ```

5. **Stop the Container**:
   ```bash
   npm run podman:down
   ```

---

### Option B: Using Podman CLI Directly

1. **Build the Container Image**:

   ```bash
   npm run podman:build
   # or: podman build -t mysite:latest -f Containerfile .
   ```

2. **Ensure Storage Directories Exist**:

   ```bash
   mkdir -p data static/uploads
   ```

3. **Run the Container**:

   ```bash
   podman run -d \
     --name mysite-app \
     --userns=keep-id \
     -p 6941:6941 \
     --env-file .env \
     -v ./data:/app/data:Z \
     -v ./static/uploads:/app/static/uploads:Z \
     mysite:latest
   ```

4. **Verify Container Status & Logs**:
   ```bash
   podman ps
   podman logs -f mysite-app
   ```

---

## First-Run Admin Setup & Security

On initial launch, the SQLite database (`data/cms.sqlite3`) is automatically created and migrated.

1. Navigate to [http://localhost:6941/admin/setup](http://localhost:6941/admin/setup).
2. Create your admin username, email address, and strong password.
3. **Save your Emergency Recovery Code**: A single-use recovery code is generated on setup. Store it safely to regain access if you ever forget your password.
4. Once setup is complete, `/admin/setup` is automatically disabled.

---

## Persistent Storage & Volumes

All dynamic CMS state is persisted on the host machine using bind-mounts:

- `./data/` -> Stores the SQLite database (`data/cms.sqlite3` and WAL journals).
- `./static/uploads/` -> Stores user-uploaded CMS images served at `/uploads/*`.

Stopping, restarting, or rebuilding the container will not lose your database records or uploaded assets.

---

## Production Deployment & CI/CD (Linode / VPS)

An automated GitHub Actions workflow (`.github/workflows/deploy.yml`) is configured to run tests, build the OCI container image, publish it to GitHub Container Registry (GHCR), and deploy to your VPS via SSH on pushes to `main`.

### Required GitHub Repository Secrets

Configure the following secrets in **GitHub Repository Settings -> Secrets and variables -> Actions**:

| Secret Name       | Description                                                                                       |
| :---------------- | :------------------------------------------------------------------------------------------------ |
| `SSH_HOST`        | VPS Hostname or public IP address (e.g. Linode instance IP).                                      |
| `SSH_USER`        | Deployment user on the VPS (e.g. `deploy` or `root`).                                             |
| `SSH_PRIVATE_KEY` | Ed25519 or RSA private SSH key configured for access to `SSH_USER`.                               |
| `SSH_PORT`        | Optional SSH port (defaults to `22` if omitted).                                                  |
| `CR_PAT`          | GitHub Personal Access Token (`read:packages`) allowing the VPS to pull private images from GHCR. |

### VPS Host Initial Setup (Debian / Ubuntu)

```bash
# 1. Install Podman, Caddy (for auto-TLS reverse proxy), and prerequisites
sudo apt update && sudo apt install -y podman caddy curl ufw

# 2. Create application and persistent storage directories
sudo mkdir -p /opt/mysite/data /opt/mysite/uploads

# 3. Create production .env file
sudo nano /opt/mysite/.env
```

### Reverse Proxy Configuration (Caddy)

Edit `/etc/caddy/Caddyfile`:

```caddy
yourdomain.com, www.yourdomain.com {
    encode zstd gzip

    # Reverse proxy to local Podman container
    reverse_proxy 127.0.0.1:6941

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Static uploads caching
    @uploads path /uploads/*
    header @uploads Cache-Control "public, max-age=31536000, immutable"
}
```

---

## Available Commands

- `npm run dev` — Run Vite local development server.
- `npm run check` — Run SvelteKit type checks.
- `npm run lint` — Check formatting and ESLint rules.
- `npm run format` — Format source files with Prettier.
- `npm test` — Run Vitest unit tests.
- `npm run build` — Build production bundle (`build/`).
- `npm run preview` — Preview production build locally with Node.
- `npm run podman:build` — Build the Podman container image.
- `npm run podman:up` — Start container in background via Podman Compose.
- `npm run podman:down` — Stop and remove Podman Compose container.
- `npm run podman:logs` — Follow real-time container logs.
