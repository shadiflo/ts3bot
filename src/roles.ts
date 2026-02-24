import { TeamSpeak } from "ts3-nodejs-library";
import { Config } from "./config";

const assignedRoles = new Map<string, Set<number>>();

export async function checkAndAssignRoles(
  teamspeak: TeamSpeak,
  uid: string,
  dbId: string,
  totalSeconds: number,
  config: Config
): Promise<void> {
  const totalMinutes = totalSeconds / 60;

  if (!assignedRoles.has(uid)) {
    assignedRoles.set(uid, new Set());
  }
  const userAssigned = assignedRoles.get(uid)!;

  for (const role of config.roles) {
    if (totalMinutes >= role.requiredMinutes && !userAssigned.has(role.serverGroupId)) {
      try {
        const serverGroups = await teamspeak.serverGroupsByClientId(dbId);
        const alreadyHas = serverGroups.some(
          (sg) => parseInt(sg.sgid as unknown as string) === role.serverGroupId
        );

        if (alreadyHas) {
          userAssigned.add(role.serverGroupId);
          continue;
        }

        await teamspeak.serverGroupAddClient(dbId, String(role.serverGroupId));
        userAssigned.add(role.serverGroupId);
        console.log(
          `[Role] Assigned "${role.name}" (group ${role.serverGroupId}) to ${uid} (${Math.floor(totalMinutes)}m cumulative)`
        );
      } catch (err: any) {
        console.error(
          `[Role] Failed to assign "${role.name}" to ${uid}:`,
          err.message
        );
      }
    }
  }
}
