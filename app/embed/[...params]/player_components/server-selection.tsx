"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Cloud, LoaderCircle, Minus, X } from "lucide-react";
import { cn } from "@/hooks/utils";
import { Audiowide } from "next/font/google";
import type {
  ServerTypes,
  SourceStatus,
} from "@/app/embed/[...params]/player_types/server-types";

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
  sourceIndex,
  sourceStatus,

  setServerIndex,
  setSourceIndex,
  setSourceStatus,
  handleServerSelect,
  color,
  canPlay,
}: Props) {
  const BASE_GLOW = `0 0 6px ${color}99, 0 0 16px ${color}59`;

  return (
    <AnimatePresence>
      {!canPlay && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "absolute md:bottom-5 bottom-3 left-1/2 -translate-x-1/2",
          )}
        >
          <div className="flex items-end gap-3">
            {servers.map((item, index) => {
              const isCurrentServer = serverIndex === index;

              return (
                <motion.div
                  key={item.server}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.2,
                    ease: "easeOut",
                  }}
                  className="md:w-85 w-52"
                >
                  <AnimatePresence>
                    {isCurrentServer && item.sources.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="mb-2 md:ml-4 ml-2 flex flex-col md:gap-2 gap-1 overflow-hidden"
                      >
                        {item.sources.map((source, sourceIdx) => {
                          const isCurrentSource =
                            isCurrentServer && sourceIndex === sourceIdx;

                          const status = isCurrentSource
                            ? sourceStatus
                            : source.status;

                          return (
                            <motion.button
                              key={`${source.link}-${sourceIdx}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{
                                duration: 0.25,
                                delay: sourceIdx * 0.2,
                                ease: "easeOut",
                              }}
                              onClick={() => {
                                setServerIndex(index);
                                setSourceIndex(sourceIdx);
                                setSourceStatus("queue");
                              }}
                              disabled={source.status === "failed"}
                              style={
                                isCurrentSource
                                  ? {
                                      borderColor: color,
                                      background: `linear-gradient(to right, ${color}20, transparent)`,
                                      // boxShadow: `inset 4px 0 12px -8px ${color}`,
                                    }
                                  : undefined
                              }
                              className={cn(
                                "w-full border-l md:p-3 px-2 py-1 text-left transition",
                                !isCurrentSource && "border-white/10",
                                source.status === "failed" &&
                                  "cursor-not-allowed opacity-50",
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span
                                  style={
                                    isCurrentSource
                                      ? {
                                          color,
                                          textShadow: BASE_GLOW,
                                        }
                                      : undefined
                                  }
                                  className={cn(
                                    "md:text-base text-sm font-semibold",
                                    source.status === "failed" &&
                                      "line-through",
                                  )}
                                >
                                  {source.resolution
                                    ? `${source.resolution}p`
                                    : source.type.toUpperCase()}
                                </span>

                                <span
                                  className={cn(
                                    "md:text-sm text-xs font-medium capitalize",
                                    status === "ready" && "text-green-400",
                                    status === "connecting" &&
                                      "animate-pulse text-white/80",
                                    status === "failed" && "text-red-400",
                                    status === "queue" && "text-white/40",
                                  )}
                                >
                                  {status}
                                  {status === "connecting" && "..."}
                                </span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => handleServerSelect(index)}
                    style={
                      isCurrentServer
                        ? {
                            borderColor: color,
                            background: `linear-gradient(to right, ${color}20, transparent)`,
                            // boxShadow: `inset 4px 0 16px -10px ${color}`,
                          }
                        : undefined
                    }
                    className={cn(
                      "flex w-full justify-between border-l-2 md:p-4 px-4 py-1 text-left transition",
                      isCurrentServer
                        ? "opacity-100"
                        : "border-white/20 opacity-50",
                    )}
                  >
                    <div className="space-y-1">
                      <span
                        style={
                          isCurrentServer
                            ? {
                                color,
                                textShadow: BASE_GLOW,
                              }
                            : undefined
                        }
                        className={cn(
                          "md:text-base text-sm font-semibold",
                          item.status === "failed" && "line-through opacity-50",
                          audiowide.className,
                        )}
                      >
                        {item.name}
                      </span>

                      <div className="md:mt-1 md:text-sm text-xs text-white/50">
                        {item.message || item.desc}
                      </div>
                    </div>

                    <span
                      style={
                        isCurrentServer &&
                        item.status !== "failed" &&
                        item.status !== "checking"
                          ? {
                              color,
                              filter: `drop-shadow(0 0 6px ${color})`,
                            }
                          : undefined
                      }
                      className={cn(
                        "flex items-center",
                        item.status === "available" &&
                          !isCurrentServer &&
                          "text-green-400",
                        item.status === "checking" &&
                          !isCurrentServer &&
                          "text-white/80",
                        item.status === "failed" && "text-red-400",
                        item.status === "queue" && "text-white/40",
                      )}
                    >
                      {item.status === "available" && (
                        <Check className="size-4.5" strokeWidth={3} />
                      )}

                      {item.status === "checking" && (
                        <LoaderCircle
                          className="size-4.5 animate-spin"
                          strokeWidth={3}
                        />
                      )}

                      {item.status === "failed" && (
                        <X className="size-4.5" strokeWidth={3} />
                      )}

                      {item.status === "queue" && (
                        <Minus className="size-4.5" strokeWidth={3} />
                      )}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
// "use client";

// import { AnimatePresence, motion } from "motion/react";
// import { Check, Cloud, LoaderCircle, Minus, X } from "lucide-react";
// import { cn } from "@/hooks/utils";
// import { Audiowide } from "next/font/google";
// import type {
//   ServerTypes,
//   SourceStatus,
// } from "@/app/embed/[...params]/server-types";

// const audiowide = Audiowide({
//   weight: "400",
//   subsets: ["latin"],
// });

// type Props = {
//   servers: ServerTypes[];
//   serverIndex: number;
//   sourceIndex: number;
//   sourceStatus: SourceStatus;
//   showServer: boolean;
//   setShowServer: React.Dispatch<React.SetStateAction<boolean>>;
//   setServerIndex: React.Dispatch<React.SetStateAction<number>>;
//   setSourceIndex: React.Dispatch<React.SetStateAction<number>>;
//   setSourceStatus: React.Dispatch<React.SetStateAction<SourceStatus>>;
//   handleServerSelect: (index: number) => void;
//   color: string;
//   canPlay: boolean;
// };

// export default function ServerSelection({
//   servers,
//   serverIndex,
//   sourceIndex,
//   sourceStatus,
//   showServer,
//   setShowServer,
//   setServerIndex,
//   setSourceIndex,
//   setSourceStatus,
//   handleServerSelect,
//   color,
//   canPlay,
// }: Props) {
//   const BASE_GLOW = `0 0 6px ${color}99, 0 0 16px ${color}59`;

//   return (
//     <AnimatePresence>
//       {showServer && (
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: 30 }}
//           transition={{ duration: 0.3, ease: "easeOut" }}
//           className={cn(
//             "absolute left-0  inset-y-0 p-6 grid place-items-center",
//             "bg-linear-to-r from-black/80 to-transparent",
//             "pointer-events-none",
//           )}
//         >
//           <div className="flex flex-col pointer-events-auto">
//             {servers.map((item, index) => {
//               const isCurrentServer = serverIndex === index;

//               return (
//                 <motion.div
//                   key={item.server}
//                   initial={{ opacity: 0, y: 15 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{
//                     duration: 0.35,
//                     delay: index * 0.2,
//                     ease: "easeOut",
//                   }}
//                   className="w-85"
//                 >
//                   <button
//                     onClick={() => handleServerSelect(index)}
//                     style={
//                       isCurrentServer
//                         ? {
//                             borderColor: color,
//                             background: `linear-gradient(to right, ${color}20, transparent)`,
//                             // boxShadow: `inset 4px 0 16px -10px ${color}`,
//                           }
//                         : undefined
//                     }
//                     className={cn(
//                       "flex w-full justify-between border-l-2 p-4 text-left transition",
//                       isCurrentServer
//                         ? "opacity-100"
//                         : "border-white/20 opacity-50",
//                     )}
//                   >
//                     <div className="space-y-1">
//                       <span
//                         style={
//                           isCurrentServer
//                             ? {
//                                 color,
//                                 textShadow: BASE_GLOW,
//                               }
//                             : undefined
//                         }
//                         className={cn(
//                           "text-base font-semibold",
//                           item.status === "failed" && "line-through opacity-50",
//                           audiowide.className,
//                         )}
//                       >
//                         {item.name}
//                       </span>

//                       <div className="mt-1 text-sm text-white/50">
//                         {item.message || item.desc}
//                       </div>
//                     </div>

//                     <span
//                       style={
//                         isCurrentServer &&
//                         item.status !== "failed" &&
//                         item.status !== "checking"
//                           ? {
//                               color,
//                               filter: `drop-shadow(0 0 6px ${color})`,
//                             }
//                           : undefined
//                       }
//                       className={cn(
//                         "flex items-center",
//                         item.status === "available" &&
//                           !isCurrentServer &&
//                           "text-green-400",
//                         item.status === "checking" &&
//                           !isCurrentServer &&
//                           "text-white/80",
//                         item.status === "failed" && "text-red-400",
//                         item.status === "queue" && "text-white/40",
//                       )}
//                     >
//                       {item.status === "available" && (
//                         <Check className="size-4.5" strokeWidth={3} />
//                       )}

//                       {item.status === "checking" && (
//                         <LoaderCircle
//                           className="size-4.5 animate-spin"
//                           strokeWidth={3}
//                         />
//                       )}

//                       {item.status === "failed" && (
//                         <X className="size-4.5" strokeWidth={3} />
//                       )}

//                       {item.status === "queue" && (
//                         <Minus className="size-4.5" strokeWidth={3} />
//                       )}
//                     </span>
//                   </button>
//                   <AnimatePresence>
//                     {isCurrentServer && item.sources.length > 0 && (
//                       <motion.div
//                         initial={{ opacity: 0, height: 0, y: -10 }}
//                         animate={{ opacity: 1, height: "auto", y: 0 }}
//                         exit={{ opacity: 0, height: 0, y: -10 }}
//                         transition={{ duration: 0.25, ease: "easeOut" }}
//                         className="mt-1 mb-1 ml-4 flex flex-col gap-2 overflow-hidden"
//                       >
//                         {item.sources.map((source, sourceIdx) => {
//                           const isCurrentSource =
//                             isCurrentServer && sourceIndex === sourceIdx;

//                           const status = isCurrentSource
//                             ? sourceStatus
//                             : source.status;

//                           return (
//                             <motion.button
//                               key={`${source.link}-${sourceIdx}`}
//                               initial={{ opacity: 0 }}
//                               animate={{ opacity: 1 }}
//                               transition={{
//                                 duration: 0.25,
//                                 delay: sourceIdx * 0.2,
//                                 ease: "easeOut",
//                               }}
//                               onClick={() => {
//                                 setServerIndex(index);
//                                 setSourceIndex(sourceIdx);
//                                 setSourceStatus("queue");
//                               }}
//                               disabled={source.status === "failed"}
//                               style={
//                                 isCurrentSource
//                                   ? {
//                                       borderColor: color,
//                                       background: `linear-gradient(to right, ${color}20, transparent)`,
//                                       // boxShadow: `inset 4px 0 12px -8px ${color}`,
//                                     }
//                                   : undefined
//                               }
//                               className={cn(
//                                 "w-full border-l p-3 text-left transition",
//                                 !isCurrentSource && "border-white/10",
//                                 source.status === "failed" &&
//                                   "cursor-not-allowed opacity-50",
//                               )}
//                             >
//                               <div className="flex items-center justify-between gap-3">
//                                 <span
//                                   style={
//                                     isCurrentSource
//                                       ? {
//                                           color,
//                                           textShadow: BASE_GLOW,
//                                         }
//                                       : undefined
//                                   }
//                                   className={cn(
//                                     "text-base font-semibold",
//                                     source.status === "failed" &&
//                                       "line-through",
//                                   )}
//                                 >
//                                   {source.resolution
//                                     ? `${source.resolution}p`
//                                     : source.type.toUpperCase()}
//                                 </span>

//                                 <span
//                                   className={cn(
//                                     "text-sm font-medium capitalize",
//                                     status === "ready" && "text-green-400",
//                                     status === "connecting" &&
//                                       "animate-pulse text-white/80",
//                                     status === "failed" && "text-red-400",
//                                     status === "queue" && "text-white/40",
//                                   )}
//                                 >
//                                   {status}
//                                   {status === "connecting" && "..."}
//                                 </span>
//                               </div>
//                             </motion.button>
//                           );
//                         })}
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </motion.div>
//               );
//             })}
//           </div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }
