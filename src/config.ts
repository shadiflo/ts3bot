import { readFileSync } from "fs";
import { join } from "path";
import "dotenv/config";

export interface RoleConfig {
  serverGroupId: number;
  name: string;
  requiredMinutes: number;
}

export interface Config {
  ts3: {
    host: string;
    queryPort: number;
    serverPort: number;
    username: string;
    password: string;
    nickname: string;
  };
  tracking: {
    pollIntervalSeconds: number;
  };
  roles: RoleConfig[];
}

export function loadConfig(): Config {
  const configPath = join(__dirname, "..", "config.json");
  const raw = readFileSync(configPath, "utf-8");
  const fileConfig = JSON.parse(raw);

  const config: Config = {
    ts3: {
      host: process.env.TS3_HOST || "",
      queryPort: parseInt(process.env.TS3_QUERY_PORT || "10011"),
      serverPort: parseInt(process.env.TS3_SERVER_PORT || "9987"),
      username: process.env.TS3_USERNAME || "serveradmin",
      password: process.env.TS3_PASSWORD || "",
      nickname: process.env.TS3_NICKNAME || "shadi_bot",
    },
    tracking: fileConfig.tracking,
    roles: fileConfig.roles,
  };

  if (!config.ts3.host || !config.ts3.password) {
    throw new Error("Missing TS3_HOST or TS3_PASSWORD in .env file");
  }
  if (!config.roles?.length) {
    throw new Error("At least one role must be configured in config.json");
  }
  if (!config.tracking?.pollIntervalSeconds || config.tracking.pollIntervalSeconds < 10) {
    throw new Error("pollIntervalSeconds must be at least 10");
  }

  return config;
}
