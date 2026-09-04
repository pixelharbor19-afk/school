"use client";

import { useEffect, useState } from "react";

export function useSandboxDetection(enabled = true) {
  const [isSandboxed, setIsSandboxed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    if (window.self === window.top) {
      setIsLoading(false);
      return;
    }

    try {
      document.domain = document.domain;
    } catch (err) {
      if (err instanceof DOMException && err.name === "SecurityError") {
        setIsSandboxed(true);
      }
    }

    setIsLoading(false);
  }, [enabled]);

  return {
    isSandboxed,
    isLoading,
  };
}
