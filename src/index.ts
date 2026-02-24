import { TeamSpeak } from "ts3-nodejs-library";
import { loadConfig } from "./config";
import { initDb, closeDb } from "./db";
import { startTracking } from "./tracker";

async function main(): Promise<void> {
  const config = loadConfig();
  console.log("[Bot] Config loaded");

  initDb();
  console.log("[Bot] Database initialized");

  const teamspeak = await TeamSpeak.connect({
    host: config.ts3.host,
    queryport: config.ts3.queryPort,
    serverport: config.ts3.serverPort,
    username: config.ts3.username,
    password: config.ts3.password,
    nickname: config.ts3.nickname,
  });

  console.log("[Bot] Connected to TS3 server");

  const interval = startTracking(teamspeak, config);

  const shutdown = async () => {
    console.log("\n[Bot] Shutting down...");
    clearInterval(interval);
    await teamspeak.quit();
    closeDb();
    console.log("[Bot] Goodbye!");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  teamspeak.on("close", async () => {
    console.log("[Bot] Connection lost, attempting reconnect...");
  });
}

main().catch((err) => {
  console.error("[Bot] Fatal error:", err.message);
  process.exit(1);
});
