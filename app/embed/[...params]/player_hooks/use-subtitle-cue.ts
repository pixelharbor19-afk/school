import { useEffect, useState } from "react";

interface Cue {
  start: number;
  end: number;
  text: string;
}

function toSec(time: string) {
  const [h, m, s] = time.trim().replace(",", ".").split(":");
  return +h * 3600 + +m * 60 + +s;
}

function parseSRT(raw: string): Cue[] {
  const blocks = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .split(/\n\n+/);

  const cues: Cue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const timeIndex = lines.findIndex((line) =>
      /\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/.test(
        line,
      ),
    );

    if (timeIndex === -1) continue;

    const [start, end] = lines[timeIndex].split("-->").map(toSec);
    const text = lines
      .slice(timeIndex + 1)
      .join("<br/>")
      .trim();

    if (text) cues.push({ start, end, text });
  }

  return cues;
}

export function useSubtitleCue(url: string | null, currentTime: number) {
  const [cues, setCues] = useState<Cue[]>([]);

  useEffect(() => {
    if (!url) {
      setCues([]);
      return;
    }

    fetch(url)
      .then((res) => res.text())
      .then((raw) => setCues(parseSRT(raw)))
      .catch(() => setCues([]));
  }, [url]);

  return (
    cues.find(({ start, end }) => currentTime >= start && currentTime <= end)
      ?.text ?? null
  );
}
