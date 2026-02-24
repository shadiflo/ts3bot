# TS3 Shadi Bot

A TeamSpeak 3 bot that tracks cumulative user time on the server and auto-assigns server groups based on configurable thresholds.

## Features

- Tracks total time each user spends on the server
- Auto-assigns server groups when time thresholds are met
- Lightweight SQLite database (no external DB needed)
- Runs with PM2 for auto-restart and persistence

## Requirements

- Node.js 18+
- A TeamSpeak 3 server with ServerQuery access
- PM2 (optional, for production)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd ts3bot
npm install
```

### 2. Configure your TS3 credentials

Copy the example env file and fill in your details:

```bash
cp .env.example .env
```

Edit `.env`:

```env
TS3_HOST=your-server-ip-or-hostname    # IP or DNS of your TS3 server
TS3_QUERY_PORT=10011                    # ServerQuery port (default: 10011)
TS3_SERVER_PORT=9987                    # TS3 voice port (default: 9987)
TS3_USERNAME=serveradmin                # ServerQuery username
TS3_PASSWORD=your_password              # ServerQuery password
TS3_NICKNAME=shadi_bot                    # Bot's display name in TS3
```

### 3. Configure roles

Edit `config.json`:

```json
{
  "tracking": {
    "pollIntervalSeconds": 60
  },
  "roles": [
    { "serverGroupId": 110, "name": "Regular", "requiredMinutes": 120 }
  ]
}
```

| Field | Description |
|---|---|
| `pollIntervalSeconds` | How often the bot checks online users (minimum 10) |
| `serverGroupId` | The TS3 server group ID to assign (see below) |
| `name` | Label for logging |
| `requiredMinutes` | Cumulative minutes needed to earn the role |

#### Finding your server group ID

In your TS3 client go to **Permissions > Server Groups** — the ID is shown next to each group name.

You can add multiple roles:

```json
"roles": [
  { "serverGroupId": 110, "name": "Regular", "requiredMinutes": 120 },
  { "serverGroupId": 111, "name": "Veteran", "requiredMinutes": 1440 },
  { "serverGroupId": 112, "name": "Elite", "requiredMinutes": 4320 }
]
```

### 4. Build and run

```bash
npm run build
```

**Development:**
```bash
npm run dev
```

**Production with PM2:**
```bash
pm2 start dist/index.js --name ts3bot
pm2 save
pm2 startup
```

**PM2 commands:**
```bash
pm2 logs ts3bot      # view live logs
pm2 status           # check if running
pm2 restart ts3bot   # restart after config changes
```

## How it works

1. Bot connects to your TS3 server via ServerQuery
2. Every `pollIntervalSeconds` it fetches all online users
3. First poll registers new users, subsequent polls add elapsed time
4. When a user's cumulative time crosses a role threshold, the bot assigns the server group
5. Time data persists in `data/bot.db` (SQLite) — survives restarts

## License

MIT
