import { MediaTaskNotifiedParams } from "@/lib/mediatoad/types";
import { TaskId } from "../utils";

export async function taskCallback({
  payload,
  transcriptId,
}: {
  payload: MediaTaskNotifiedParams;
  transcriptId: string;
}) {
  const { task } = payload;
}
PageTransitionEvent