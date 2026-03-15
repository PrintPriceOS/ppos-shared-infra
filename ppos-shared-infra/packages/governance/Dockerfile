# ppos-shared-infra/packages/governance/Dockerfile
FROM node:20-slim

WORKDIR /app

# Copy shared infra package
COPY . /ppos-shared-infra

# Link and install
WORKDIR /app/run
COPY packages/governance/package.json .
RUN npm install
RUN npm link /ppos-shared-infra

# Use the governance manager script from shared infra
CMD ["node", "/ppos-shared-infra/packages/governance/governanceManager.js"]
