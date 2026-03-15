#!/usr/bin/env node
/**
 * Run Local Dashboard
 * Starts the Vite dev server for the operator dashboard.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';

console.log('🖥️ Starting Local Dashboard...');
execSync('pnpm --filter @ppos/operator-dashboard-ui dev', { stdio: 'inherit' });
