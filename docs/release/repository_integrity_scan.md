# Repository Integrity Scan Report — PrintPrice OS

## 1. Forbidden Artifacts
| Artifact | Location | Status | Classification |
| :--- | :--- | :--- | :--- |
| `.env` | Root | Detected | must-ignore |
| `.env` | `ppos-preflight-worker/` | Detected | must-ignore |
| `.env` | `ppos-preflight-service/` | Detected | must-ignore |
| `.env.example` | Root | Detected | safe |
| `.env.example` | `ppos-preflight-worker/` | Detected | safe |
| `.env.example` | `ppos-preflight-service/` | Detected | safe |

## 2. OS Artifacts
| Artifact | Location | Status | Classification |
| :--- | :--- | :--- | :--- |
| `desktop.ini` | Multiple | Likely (Windows) | must-delete |
| `Thumbs.db` | Multiple | Likely (Windows) | must-delete |
| `.DS_Store` | Multiple | Not detected | must-ignore |

## 3. Temporary Artifacts
| Artifact | Location | Status | Classification |
| :--- | :--- | :--- | :--- |
| `node_modules/` | Multiple | Detected | must-ignore |
| `.runtime/` | Root | Detected | must-ignore |
| `.setup-logs/` | Root | Detected | must-delete |
| `bootstrap_output.log` | Root | Detected | must-delete |
| `backups/` | Root | Detected | must-delete |
| `dist/` | `PrintPricePro_Preflight-master/` | Detected | must-ignore |

## 4. Sensitive Files
| Artifact | Location | Status | Classification |
| :--- | :--- | :--- | :--- |
| Private Keys (`.key`) | N/A | None detected | safe |
| Certificates (`.crt`, `.pem`) | N/A | None detected | safe |
| `credentials.json` | N/A | None detected | safe |

## Findings Summary
- Multiple `.env` files exist in sub-repositories.
- Root `.env` exists.
- Temporary logs and backups are present in the root.
- OS artifacts (`desktop.ini`) are likely present given the environment is Windows.

## Recommendations
- Ensure ALL `.env` files are in `.gitignore`.
- Delete `.setup-logs/`, `backups/`, and `bootstrap_output.log` before pushing.
- Create a root `.gitignore` to cover all sub-directories.
