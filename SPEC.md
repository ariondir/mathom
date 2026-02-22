# Mathom — Product Specification (MVP)

> Named after the Tolkien concept of gifts passed between hobbits.

---

## What Is Mathom?

A peer-to-peer desktop app for sharing media within a family. Each family member runs their own instance. Files are stored locally on each person's machine. You connect to family members via a one-time invite link, then share files directly between instances — with a provenance chain tracking who shared what with whom.

No cloud. No subscription. No algorithm. Just your family sharing things they love.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript (Vite) |
| Backend | NestJS + TypeScript |
| Desktop shell | Tauri (Rust) |
| Database | SQLite (embedded, zero setup) |
| ORM | TypeORM |
| Package manager | pnpm (monorepo workspaces) |
| Repo | github.com/ariondir/mathom |

**How they fit together:** Tauri wraps the React frontend as a desktop app. It spawns the NestJS backend as a sidecar process on startup. The frontend talks to the backend over localhost HTTP. The backend handles all business logic, file I/O, and peer-to-peer transfers.

---

## Monorepo Structure

```
mathom/
├── apps/
│   ├── frontend/       # React + Vite
│   ├── backend/        # NestJS
│   └── desktop/        # Tauri shell
├── pnpm-workspace.yaml
└── package.json
```

---

## MVP Scope

### In
- Upload files to your local library
- Browse your library in a web UI
- Add family members via one-time invite link
- Share files with connected family members (pull-based, TLS-encrypted)
- Resumable transfers with progress tracking
- Transfer status notifications ("Transfer paused — waiting for Dad to come back online")
- Provenance tracking (who shared what, when, chain of custody)
- Storage usage display

### Out (roadmap)
- In-app playback (audio/video/PDF)
- End-to-end encryption
- Cryptographically signed provenance
- Syncthing integration
- Nostr/BitChat-based discovery
- Metadata auto-detection from file tags or external APIs
- Notifications ("Dad added a new thriller")
- Cross-device playback position sync
- Mobile PWA
- Soft storage limits
- Preference tags and recommendations

---

## Core Features

### 1. Library
- Files are stored in `~/Mathom/` by default (shown on first run, changeable in settings)
- Users can add files to their library (drag & drop or file picker)
- Library view shows: name, type, size, who it came from, when added
- Organized into sections (audio, video, books, other)
- No playback in MVP — files open in the OS default app

### 2. Contacts
- Click "Add contact" → generates a one-time invite link
- Share the link however you want (text, email, etc.)
- Recipient pastes the link into their Mathom → connection established
- Link expires after one use
- Contacts list shows name and online/offline status

### 3. Sharing
- Select a file → choose a contact → share
- Sender's app announces the file is available
- Recipient's app fetches the file (pull model — more reliable behind home routers)
- Transfers are chunked and resumable
- Progress shown in UI
- If recipient is offline: "Transfer paused — waiting for [name] to come back online"
- App resumes automatically when peer reconnects
- Anyone can re-share a file they've received (the mathom concept — the chain grows)

### 4. Provenance
- Every file in your library has a record of where it came from
- Share records show: sender, recipient, timestamp, file
- Chain is visible in the file detail view (e.g., "Shared by Mom → you → Grandma")

---

## Data Model

### `file`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | primary key |
| name | string | display name |
| path | string | absolute path on disk |
| mimeType | string | e.g. audio/mp3 |
| size | integer | bytes |
| section | enum | audio, video, book, other |
| createdAt | datetime | when added to library |

### `contact`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | primary key |
| name | string | display name |
| host | string | IP or hostname |
| port | integer | port their backend listens on |
| publicKey | string | for TLS verification |
| createdAt | datetime | when connection was established |

### `share`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | primary key |
| fileId | uuid | FK → file |
| fromContactId | uuid | FK → contact (null if you are the origin) |
| toContactId | uuid | FK → contact (null if you received it) |
| direction | enum | sent, received |
| status | enum | pending, in_progress, paused, complete, failed |
| bytesTransferred | integer | for resumable progress |
| sharedAt | datetime | |

### `invite`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | primary key |
| token | string | one-time token in the link |
| used | boolean | expires after first use |
| createdAt | datetime | |

---

## Networking

- Each Mathom instance runs a local NestJS HTTP server on a configurable port (default: 7575)
- Transfers use HTTPS (TLS) between instances
- Pull model: sender marks a file as "available for [contact]", receiver polls/fetches
- Chunked transfer: files split into chunks, each chunk tracked for resumability
- Peer presence: periodic ping to detect online/offline status

---

## Future Roadmap

1. E2E encryption (keypair per user, encrypt file chunks)
2. Cryptographically signed provenance chain
3. Syncthing integration for robust sync
4. Nostr npub identity and peer discovery
5. BitChat integration (research needed)
6. In-app playback (audio, video, PDF)
7. Metadata enrichment (file tags + optional external APIs)
8. Notification system
9. Mobile PWA
10. Cross-device playback position sync
11. Soft storage limits (% of disk)
12. Preference tags and recommendations
