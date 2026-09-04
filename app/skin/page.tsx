"use client";

import { useState } from "react";
import { Anton, JetBrains_Mono } from "next/font/google";

const anton = Anton({ weight: "400", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
});

export default function NeonBroadcastPlayer() {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#050505]">
      <div
        className={`${jetbrainsMono.className} relative h-screen w-full  overflow-hidden rounded-md bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_90px_rgba(0,0,0,0.8)]`}
      >
        {/* top-left: now playing title block */}
        <div className="absolute left-6 top-[22px]">
          <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-white/50">
            Now Playing · S1 E4
          </div>
          <div
            className={`${anton.className} text-xl tracking-wide text-neutral-100`}
            style={{ textShadow: "0 0 14px rgba(255,30,30,0.3)" }}
          >
            MIDNIGHT SIGNAL
          </div>
        </div>

        {/* top-right: logo */}
        <div
          className={`${anton.className} absolute right-6 top-6 text-[22px] tracking-wide text-white/90`}
          style={{ textShadow: "0 0 18px rgba(255,30,30,0.35)" }}
        >
          FLUX<span className="text-red-500">TV</span>
        </div>

        {/* center play button */}
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="absolute left-1/2 top-1/2 flex h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-500/40 bg-[#0f0f0f]/60 transition-transform duration-200 hover:scale-105"
          style={{
            boxShadow:
              "0 0 30px rgba(255,20,20,0.35), inset 0 0 20px rgba(255,20,20,0.1)",
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg
              width="22"
              height="24"
              viewBox="0 0 24 24"
              fill="#ff3b3b"
              style={{ filter: "drop-shadow(0 0 8px rgba(255,40,40,0.8))" }}
            >
              <rect x="4" y="3" width="5" height="18" rx="1" />
              <rect x="15" y="3" width="5" height="18" rx="1" />
            </svg>
          ) : (
            <svg
              width="24"
              height="26"
              viewBox="0 0 24 26"
              fill="#ff3b3b"
              className="ml-1"
              style={{ filter: "drop-shadow(0 0 8px rgba(255,40,40,0.8))" }}
            >
              <polygon points="0,0 24,13 0,26" />
            </svg>
          )}
        </button>

        {/* bottom controls */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-6 pb-5 pt-10">
          {/* scrubber */}
          <div className="group relative mb-4 h-1 cursor-pointer rounded-full bg-white/10">
            <div className="absolute left-0 top-0 h-full w-[55%] rounded-full bg-white/15" />
            <div
              className="absolute left-0 top-0 h-full w-[38%] rounded-full"
              style={{
                background: "linear-gradient(90deg, #b3000c, #ff2b2b)",
                boxShadow: "0 0 12px rgba(255,30,30,0.7)",
              }}
            />
            <div
              className="absolute top-1/2 h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500"
              style={{
                left: "38%",
                boxShadow: "0 0 10px 3px rgba(255,30,30,0.7)",
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="flex items-center text-white/85 transition-colors hover:text-red-500 hover:drop-shadow-[0_0_6px_rgba(255,40,40,0.6)]"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="4" y="3" width="5" height="18" rx="1" />
                    <rect x="15" y="3" width="5" height="18" rx="1" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="0,0 24,12 0,24" />
                  </svg>
                )}
              </button>

              <button
                className="flex items-center text-white/85 transition-colors hover:text-red-500 hover:drop-shadow-[0_0_6px_rgba(255,40,40,0.6)]"
                aria-label="Restart"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 3v2a7 7 0 1 0 6.32 4H16l3-4 3 4h-2.06A9 9 0 1 1 12 3z" />
                </svg>
              </button>

              <span className="text-xs tracking-wide text-neutral-300">
                18:24 / 47:10
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="rounded-sm border border-red-500/40 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-red-500">
                1080p HD
              </span>

              <button
                className="flex items-center text-white/85 transition-colors hover:text-red-500 hover:drop-shadow-[0_0_6px_rgba(255,40,40,0.6)]"
                aria-label="Volume"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3z" />
                </svg>
              </button>

              <button
                className="flex items-center text-white/85 transition-colors hover:text-red-500 hover:drop-shadow-[0_0_6px_rgba(255,40,40,0.6)]"
                aria-label="Fullscreen"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
