# ppos-preflight-worker/Dockerfile
FROM node:20-slim

# Install system dependencies for PDF processing
RUN apt-get update && apt-get install -y \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the actual motor/engine if it's external (symlinked in local dev)
# In production, these should be handled via a monorepo build or npm packages.
# For this bootstrap, we assume the host provides the volume or we copy relative.
COPY . .

RUN npm install

# The entrypoint script is worker.js which now handles the pool bootstrap
CMD ["node", "worker.js"]
