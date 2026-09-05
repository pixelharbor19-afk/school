import { motion } from "framer-motion";

const LAMP_COLOR = {
  tailwindBg: "bg-blue-600/10",
  tailwindLine: "bg-blue-600/70",
  conic: "rgba(37,99,235,0.4)",
};

// Left conic: fade bottom + fade outer (left) edge
const leftConicMask = {
  maskImage:
    "linear-gradient(to bottom, white 40%, transparent 100%), linear-gradient(to right, transparent, white 40%)",
  maskComposite: "intersect" as const,
  WebkitMaskImage:
    "linear-gradient(to bottom, white 40%, transparent 100%), linear-gradient(to right, transparent, white 40%)",
  WebkitMaskComposite: "source-in",
};

// Right conic: fade bottom + fade outer (right) edge
const rightConicMask = {
  maskImage:
    "linear-gradient(to bottom, white 40%, transparent 100%), linear-gradient(to left, transparent, white 40%)",
  maskComposite: "intersect" as const,
  WebkitMaskImage:
    "linear-gradient(to bottom, white 40%, transparent 100%), linear-gradient(to left, transparent, white 40%)",
  WebkitMaskComposite: "source-in",
};

export default function Lamp() {
  return (
    <div className="absolute top-20 isolate z-0 w-screen flex-1 items-start justify-center hidden dark:flex lg:scale-100 scale-50 ">
      {/* Optional Blur Layer */}
      <div className="absolute top-0 z-50 h-48 w-screen bg-transparent opacity-10 backdrop-blur-md" />

      {/* Main glow */}
      <div
        className={`absolute inset-auto z-50 h-40 w-[28rem] -translate-y-[-30%] rounded-full ${LAMP_COLOR.tailwindBg} opacity-80 blur-3xl`}
      />

      {/* Lamp effect pulse */}
      <motion.div
        initial={{ width: "8rem" }}
        whileInView={{ width: "16rem" }}
        transition={{ ease: "easeInOut", delay: 0.8, duration: 1.2 }}
        className={`absolute top-0 z-30 h-36 -translate-y-[20%] rounded-full ${LAMP_COLOR.tailwindBg} blur-2xl`}
      />

      {/* Top line */}
      <motion.div
        initial={{ width: "15rem" }}
        whileInView={{ width: "30rem" }}
        transition={{ ease: "easeInOut", delay: 0.8, duration: 1.2 }}
        className={`absolute inset-auto z-50 h-0.5 -translate-y-[-10%] ${LAMP_COLOR.tailwindLine}`}
      />

      {/* Left conic gradient */}
      <motion.div
        initial={{ opacity: 0.5, width: "15rem" }}
        whileInView={{ opacity: 1, width: "30rem" }}
        transition={{ delay: 0.8, duration: 1.2, ease: "easeInOut" }}
        style={{
          backgroundImage: `conic-gradient(from 80deg at center top, ${LAMP_COLOR.conic}, transparent, transparent)`,
          ...leftConicMask,
        }}
        className="absolute inset-auto right-1/2 h-56 w-[30rem]"
      />

      {/* Right conic gradient */}
      <motion.div
        initial={{ opacity: 0.5, width: "15rem" }}
        whileInView={{ opacity: 1, width: "30rem" }}
        transition={{ delay: 0.8, duration: 1.2, ease: "easeInOut" }}
        style={{
          backgroundImage: `conic-gradient(from 280deg at center top, transparent, transparent, ${LAMP_COLOR.conic})`,
          ...rightConicMask,
        }}
        className="absolute inset-auto left-1/2 h-56 w-[30rem]"
      />
    </div>
  );
}
