export const SERVERS: ServerTypes[] = [
  {
    name: "Andromeda",
    status: "queue",
    server: "andromeda",
    desc: "Smooth Playback & HD",
    sources: [],
  },

  {
    name: "Centaurus",
    status: "queue",
    server: "centaurus",
    desc: "Alternative",
    sources: [],
  },
  {
    name: "Milky Way",
    status: "queue",
    server: "milkyway",
    desc: "Alternative",
    sources: [],
  },
];

export type SourceStatus = "queue" | "connecting" | "ready" | "failed";

export type SourceTypes = {
  type: "mp4" | "hls" | "dash";
  link: string;
  resolution: number | null;
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
