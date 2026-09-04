"use client";

import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";

import { AnimatePresence, motion } from "motion/react";
import { Audiowide } from "next/font/google";
import type {
  ServerTypes,
  SourceStatus,
} from "@/app/embed/[...params]/server-types";

const audiowide = Audiowide({
  weight: "400",
  subsets: ["latin"],
});

type Props = {
  servers: ServerTypes[];
  serverIndex: number;
  sourceIndex: number;
  sourceStatus: SourceStatus;

  setServerIndex: React.Dispatch<React.SetStateAction<number>>;
  setSourceIndex: React.Dispatch<React.SetStateAction<number>>;
  setSourceStatus: React.Dispatch<React.SetStateAction<SourceStatus>>;
  handleServerSelect: (index: number) => void;
  color: string;
  canPlay: boolean;
};

export default function ServerSelection({
  servers,
  serverIndex,
  sourceStatus,
  color,
  canPlay,
}: Props) {
  if (canPlay) return null;

  const server = servers[serverIndex];

  const text = getLoadingText(server, sourceStatus);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute left-1/2 -translate-x-1/2 bottom-30 z-30 flex items-end justify-center"
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Tailspin size="42" stroke="6" speed="1" color={color} />

          <motion.div
            key={text}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-5 px-6"
          >
            <p
              className={`text-sm font-medium text-white/70 ${audiowide.className}`}
            >
              {text}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function getLoadingText(
  server: ServerTypes | undefined,
  sourceStatus: SourceStatus,
) {
  if (!server) {
    return "Preparing...";
  }

  if (server.status === "queue") {
    return "Waiting...";
  }

  if (server.status === "checking") {
    return `Checking ${server.name}...`;
  }

  if (server.status === "failed") {
    return "Trying another server...";
  }

  if (sourceStatus === "queue") {
    return "Preparing source...";
  }

  if (sourceStatus === "connecting") {
    return `Connecting to ${server.name}...`;
  }

  if (sourceStatus === "failed") {
    return "Trying another source...";
  }

  return server.message || "Loading...";
}
