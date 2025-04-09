import { Task } from "../mediatoad/types";

export function getBaseUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return "https://lms-app.vercel.app";
}

export function generateTaskId({
  operation,
  transcriptId,
}: {
  operation: Task["operation"];
  transcriptId: string;
}) {
  return `${operation}-task-${transcriptId}`;
}

export const TaskId = {
  generate: (operation: Task["operation"], transcriptId: string): string => {
    return `${operation}-task-${transcriptId}`;
  },

  extractTranscriptId: (
    taskId: string,
    operation: Task["operation"]
  ): string => {
    const regex = new RegExp(`^${operation}-task-`);
    return taskId.replace(regex, "");
  },
};
