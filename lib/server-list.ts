export type ServerStatus =
  | "queue"
  | "checking"
  | "connecting"
  | "available"
  | "failed";

export type ServerTypes = {
  name: string;
  server: string;
  status: ServerStatus;
  desc: string;
  message?: string;
};
