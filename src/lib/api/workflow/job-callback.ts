import { MediaJobNotifiedParams } from "@/lib/mediatoad/types";
import { supabase } from "@/supabase/client";

export async function jobCallback(args: {
  payload: MediaJobNotifiedParams;
  transcriptId: string;
}) {
  try {
    const { tasks } = args.payload;

    const isAllDone = tasks.every((task) => task.status === "DONE");

    if (!isAllDone) {
      await supabase
        .from("transcripts")
        .update({ status: "FAILED" })
        .eq("id", args.transcriptId);
    }
  } catch(error) {
    throw new Error(
      `Error in jobCallback: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
