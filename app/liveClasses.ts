import type { SupabaseClient } from "@supabase/supabase-js";
import { privateChannel, releaseRealtimeChannels } from "./realtime.ts";

export type LiveClassroom = {
  id: string;
  name: string;
  subject: string;
  joinCode?: string;
  hasActivity?: boolean;
  hasLiveShare?: boolean;
  liveSessionId?: string | null;
};

export function pendingLiveClasses(classrooms: LiveClassroom[], dismissed: Record<string, string>) {
  return classrooms.filter((classroom) => classroom.liveSessionId && dismissed[classroom.id] !== classroom.liveSessionId);
}

export function retainLiveDismissals(classrooms: LiveClassroom[], dismissed: Record<string, string>) {
  return Object.fromEntries(Object.entries(dismissed).filter(([id, session]) => classrooms.some((classroom) => classroom.id === id && classroom.liveSessionId === session)));
}

// Receive announcements only. Presence would incorrectly mark a student online in every class.
export async function listenForLiveClasses(client: SupabaseClient, classroomIds: string[], refresh: () => void, connectionChanged: (available: boolean) => void) {
  let stopped = false;
  const connected = new Set<string>();
  const ids = [...new Set(classroomIds)];
  const channels = await Promise.all(ids.map(async (id) => {
    const channel = await privateChannel(client, `class:${id}`);
    for (const event of ["class:activity-deployed", "class:activity-ended", "class:live-share"]) {
      channel.on("broadcast", { event }, () => { if (!stopped) refresh(); });
    }
    channel.subscribe((status) => {
      if (stopped) return;
      if (status === "SUBSCRIBED") {
        connected.add(id);
        if (connected.size === ids.length) connectionChanged(true);
        refresh(); // Also recovers announcements missed before joining or while disconnected.
      } else {
        connected.delete(id);
        if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) connectionChanged(false);
      }
    });
    return channel;
  }));
  return () => {
    stopped = true;
    return releaseRealtimeChannels(client, channels);
  };
}
