import { create } from "zustand";
import { persist } from "zustand/middleware";

type PopupStore = {
  lastTriggered: number;
  handlePopup: () => void;
};

export const usePopupStore = create<PopupStore>()(
  persist(
    (set, get) => ({
      lastTriggered: 0,

      handlePopup: () => {
        const now = Date.now();

        if (now - get().lastTriggered < 10 * 60 * 1000) {
          return;
        }

        const parentHost = document.referrer
          ? new URL(document.referrer).hostname
          : "";

        const blockedDomains = [
          "bcine.ru",
          "zflix.me",
          "zxcstream.icu",
          "7movies.ac",
          "vidstuck.xyz",
          "xcinematv.com",
          "allflix.org",
          "flyflix.net",
          "localhost",
        ];

        if (
          blockedDomains.some(
            (domain) =>
              parentHost === domain || parentHost.endsWith(`.${domain}`),
          )
        ) {
          return;
        }

        set({ lastTriggered: now });

        window.open("https://zxcstream.icu", "_blank", "noopener,noreferrer");
      },
    }),
    {
      name: "zxc",
    },
  ),
);
