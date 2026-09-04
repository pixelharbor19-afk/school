export const SERVERS: ServerTypes[] = [
  {
    name: "Zinogre I",
    status: "queue",
    server: "zinogre",
    desc: "Movies & TV Shows - HD Support",
    sources: [],
  },
  {
    name: "Valstrax I",
    status: "queue",
    server: "valstrax",
    desc: "HD Quality & Reliable",
    sources: [],
  },
  {
    name: "Alatreon II",
    status: "queue",
    server: "alatreon",
    desc: "Extensive Movie & TV Library",
    sources: [],
  },
];

export type SourceStatus = "queue" | "connecting" | "ready" | "failed";

export type SourceTypes = {
  type: "mp4" | "hls" | "dash";
  link: string;
  resolution?: number;
  status: SourceStatus;
};

export type ServerStatus = "queue" | "checking" | "available" | "failed";

export type ServerTypes = {
  name: string;
  server: string;
  status: ServerStatus;
  desc: string;
  message?: string;
  sources: SourceTypes[];
};

export const sourceKey = (server: string, link: string) => `${server}:${link}`;
