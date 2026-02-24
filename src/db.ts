import Database from "better-sqlite3";
import { join } from "path";
import { mkdirSync } from "fs";

export interface UserTimeRecord {
  uid: string;
  nickname: string;
  total_seconds: number;
  last_seen: number;
}

let db: Database.Database;

export function initDb(): void {
  const dataDir = join(__dirname, "..", "data");
  mkdirSync(dataDir, { recursive: true });

  db = new Database(join(dataDir, "bot.db"));
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_time (
      uid TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      total_seconds INTEGER NOT NULL DEFAULT 0,
      last_seen INTEGER NOT NULL DEFAULT 0
    )
  `);
}

const stmts = {
  get upsert() {
    return db.prepare(`
      INSERT INTO user_time (uid, nickname, total_seconds, last_seen)
      VALUES (@uid, @nickname, 0, @lastSeen)
      ON CONFLICT(uid) DO UPDATE SET nickname = @nickname, last_seen = @lastSeen
    `);
  },
  get addTime() {
    return db.prepare(`
      UPDATE user_time
      SET total_seconds = total_seconds + @seconds, last_seen = @lastSeen
      WHERE uid = @uid
    `);
  },
  get getUser() {
    return db.prepare("SELECT * FROM user_time WHERE uid = @uid");
  },
  get getAllUsers() {
    return db.prepare("SELECT * FROM user_time");
  },
};

export function upsertUser(uid: string, nickname: string, lastSeen: number): void {
  stmts.upsert.run({ uid, nickname, lastSeen });
}

export function addTime(uid: string, seconds: number, lastSeen: number): void {
  stmts.addTime.run({ uid, seconds, lastSeen });
}

export function getUserTime(uid: string): UserTimeRecord | undefined {
  return stmts.getUser.get({ uid }) as UserTimeRecord | undefined;
}

export function getAllUsers(): UserTimeRecord[] {
  return stmts.getAllUsers.all() as UserTimeRecord[];
}

export function closeDb(): void {
  if (db) db.close();
}
