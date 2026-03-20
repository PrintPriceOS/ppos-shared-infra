# DOCKER_DEPLOYMENT_GUIDE (Hardened & Verified)

**Status**: 🔵 PRODUCTION READY
**Version**: v2.1.2-certified
**Stack**: Docker Compose + Node.js 20
**Environment**: Plesk / Linux Canonical Root

---

## 🏗️ 1. Directory Structure (Canonical)

The project resides in `/opt/printprice-os/` where each component is a sibling folder:

```text
/opt/printprice-os/
  ├── ppos-preflight-service/
  ├── ppos-preflight-worker/
  ├── ppos-preflight-engine/
  ├── ppos-shared-infra/
  └── docker-compose.preflight.yml
```

---

## 🔨 2. Deployment Sequence (Step by Step)

### A. Syncing Components
Run these commands to ensure every submodule and the shared infra are up to date:

```bash
cd /opt/printprice-os/ppos-preflight-engine
git pull origin phase-10-intelligence-layer

cd /opt/printprice-os/ppos-preflight-service
git pull origin phase-10-intelligence-layer

cd /opt/printprice-os/ppos-preflight-worker
git pull origin phase-10-intelligence-layer

cd /opt/printprice-os/ppos-shared-infra
git pull ppos release/v2.1.2-certified
```

### B. Build & Launch
Go back to the root folder to run the Docker Compose commands:

```bash
cd /opt/printprice-os

# Clean build to apply Dockerfile changes (--install-links fix)
docker compose -f docker-compose.preflight.yml build --no-cache

# Restart services
docker compose -f docker-compose.preflight.yml up -d
```

---

## 📡 3. Verification & Troubleshooting

### Health Checks
- **Service**: `curl http://localhost:8001/health`
- **Worker**: `curl http://localhost:8002/health`

### Common Fixes
- **MySQL permissions**: If "Access Denied" persists, run:
  `docker exec -it ppos-mysql mysql -u root -proot printprice_os -e "GRANT ALL PRIVILEGES ON printprice_os.* TO 'ppos_user'@'%'; FLUSH PRIVILEGES;"`
- **Missing Module**: Ensure you ran `build --no-cache` to pick up the `--install-links` fix in the Dockerfiles.
