import { TeamSpeak } from "ts3-nodejs-library";
import { upsertUser, addTime, getUserTime } from "./db";
import { checkAndAssignRoles } from "./roles";
import { Config } from "./config";

const lastPollTime = new Map<string, number>();

export async function pollOnlineUsers(teamspeak: TeamSpeak, config: Config): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  const clients = await teamspeak.clientList({ clientType: 0 });

  for (const client of clients) {
    const uid = client.uniqueIdentifier;
    const nickname = client.nickname;

    const existing = getUserTime(uid);
    const lastSeen = lastPollTime.get(uid);

    if (lastSeen) {
      const elapsed = now - lastSeen;
      if (elapsed > 0 && elapsed < config.tracking.pollIntervalSeconds * 3) {
        addTime(uid, elapsed, now);
        const updated = getUserTime(uid)!;
        const totalMin = Math.floor(updated.total_seconds / 60);
        console.log(`[Track] ${nickname} (${uid}): +${elapsed}s, total ${totalMin}m`);
        await checkAndAssignRoles(teamspeak, uid, client.databaseId, updated.total_seconds, config);
      }
    }

    if (!existing) {
      upsertUser(uid, nickname, now);
      console.log(`[New] Tracking new user: ${nickname} (${uid})`);
    } else {
      upsertUser(uid, nickname, now);
    }

    lastPollTime.set(uid, now);
  }

  // Clean up users who went offline
  for (const [uid, _] of lastPollTime) {
    if (!clients.some((c) => c.uniqueIdentifier === uid)) {
      lastPollTime.delete(uid);
    }
  }
}

export function startTracking(teamspeak: TeamSpeak, config: Config): NodeJS.Timeout {
  const intervalMs = config.tracking.pollIntervalSeconds * 1000;

  console.log(`[Tracker] Polling every ${config.tracking.pollIntervalSeconds}s`);

  // Initial poll
  pollOnlineUsers(teamspeak, config).catch((err) =>
    console.error("[Tracker] Poll error:", err.message)
  );

  return setInterval(() => {
    pollOnlineUsers(teamspeak, config).catch((err) =>
      console.error("[Tracker] Poll error:", err.message)
    );
  }, intervalMs);
}
