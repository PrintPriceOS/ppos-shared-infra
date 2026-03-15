# Red Team Report: Filesystem Attack

## Audit Objective
Test the platform's behavior under restricted or corrupted filesystem conditions, focusing on PDF processing and job execution.

## Filesystem Vulnerabilities

### 📂 Vulnerability 1: The "Read-Only" Trap
- **Scenario**: The `uploads/` or `/tmp/ppos-preflight` directory is mounted as Read-Only.
- **Result**: `fs.mkdirSync` or `fs.writeFile` in `pdfUploadWaf.js` throws an `EACCES` error.
- **Impact**: 🛑 **DoS (Denial of Service)**. The server crashes or the request hangs. There is no automated fallback to a temporary in-memory buffer.

### 📂 Vulnerability 2: Space Exhaustion (Disk Bomb)
- **Scenario**: A malicious user uploads 100x 500MB PDFs rapidly.
- **Result**: Multer fills the `dest` folder.
- **Impact**: 🛑 **Global Outage**. Once the disk is 100% full, database logs cannot be written, and the entire host OS becomes unstable.
- **Detection**: No active disk quota monitor was found in the boot sequence.

### 📂 Vulnerability 3: Symlink Injection
- **Scenario**: User attempts to upload a file named `../../etc/passwd`.
- **Mitigation Check**: `safeBasename` in `pdfUploadWaf.js` correctly sanitizes names to `[^a-zA-Z0-9._-]`.
- **Status**: ✅ **SECURE**. Path traversal via filename is mitigated.

### 📂 Vulnerability 4: Race Condition (Cleanup Cycle)
- **Scenario**: `startCleanupTask` deletes a file that a worker is still processing.
- **Result**: The worker throws `ENOENT` during Ghostscript execution.
- **Impact**: ⚠️ **Job Failure**.
- **Detection**: `cleanup.js` assumes any file older than `X` is safe, but high-latency Ghostscript jobs can exceed this limit if the cleanup frequency is too aggressive.

## Findings
- **Unchecked System Calls**: Many `fs` operations are performed synchronously (`mkdirSync`, `readFileSync`) without wrapping them in try-catch blocks at the point of call, leading to process-wide crashes on permission errors.
- **Absolute Mount Dependence**: Dockerfiles hardcode `/tmp/ppos-preflight`. If the host OS restricts `/tmp` or has it on a small RAM-disk, large PDF processing will fail.

## Remediation Plan
1. **P0: Async & Guarded Writes**: Transition all critical file writes to `async` and wrap in specific error handlers that return a `SYSTEM_ERROR` API response instead of killing the process.
2. **Implement Disk Quotas**: Add a startup check for available disk space and reject huge uploads if free space is < 1GB.
3. **Quarantine Isolation**: Ensure the `quarantine` directory is on a separate partition or has restricted IOPS to prevent a "Slow-Death" DoS attack via large corrupted file writes.
