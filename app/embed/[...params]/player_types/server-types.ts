export const SERVERS: ServerTypes[] = [
  {
    name: "Andromeda",
    status: "queue",
    server: "andromeda",
    desc: "Smooth Playback & HD",
    dubSupport: false,
    sources: [],
  },
  {
    name: "Centaurus",
    status: "queue",
    server: "centaurus",
    desc: "Multi Audio Support",
    dubSupport: true,
    sources: [],
  },
  {
    name: "Milky Way",
    status: "queue",
    server: "milkyway",
    desc: "Alternative",
    dubSupport: false,
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
  dubSupport: boolean;
};

export const sourceKey = (server: string, link: string) => `${server}:${link}`;
