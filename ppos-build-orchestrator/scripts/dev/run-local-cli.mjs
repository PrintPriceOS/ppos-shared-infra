#!/usr/bin/env node
/**
 * Run Local CLI
 * Starts the build CLI wrapper.
 */
import { execSync } from 'node:child_process';

console.log('🛠️ Starting Local CLI...');
execSync('pnpm --filter @ppos/build-cli run start', { stdio: 'inherit' });
