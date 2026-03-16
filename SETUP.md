# Setup Guide — PrintPrice OS

## Prerequisites

Before setting up the environment, ensure the following are installed:

- **Node.js**: `v20.x` or higher.
- **npm**: `v10.x` or higher.
- **Docker Desktop**: Required for infrastructure services.
- **Ghostscript**: `v10.0x` (Ensure `gs` or `gswin64c` is in your PATH).

## Automated Setup

The easiest way to get started is by using the master setup script:

### Windows
```powershell
.\setup.ps1
```

### Linux / macOS
```bash
./setup.sh
```

### What the script does:
1. Validates system dependencies.
2. Initializes environment variables from `.env.example`.
3. Creates the `.runtime/` directory structure.
4. Performs a deterministic `npm ci` across all services.
5. Builds modular packages.
6. Starts the Docker infrastructure (Database, Redis, etc.)
7. Runs service health checks.

## Manual Configuration

If you prefer to configure components manually, refer to the individual `README.md` files in each service directory.

### Environment Variables
Key variables are managed in the root `.env` file. Do NOT commit this file to version control.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PPOS_PORT` | Main API Port | `3000` |
| `REDIS_HOST` | Redis Server | `localhost` |
| `MYSQL_HOST` | Database Server | `localhost` |

## Troubleshooting

- **Docker Errors**: Ensure the Docker daemon is running and you have sufficient permissions.
- **Dependency Issues**: If `npm ci` fails due to a lockfile mismatch, try `npm install` and report the inconsistency.
- **Port Conflicts**: Ensure ports `3000`, `8001`, `3306`, and `6379` are available.
