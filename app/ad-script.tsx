// import Script from "next/script";

// export default function AdScript() {
//   return (
//     <Script
//       id="anti-adblock-script"
//       src="/vidstuck.js"
//       strategy="afterInteractive"
//     />
//   );
// }
import Script from "next/script";

export default function AdScript() {
  if (
    typeof document !== "undefined" &&
    (() => {
      try {
        const parent = new URL(document.referrer).hostname;

        return parent === "zxcstream.icu" || parent.endsWith(".zxcstream.icu");
      } catch {
        return false;
      }
    })()
  ) {
    return null;
  }

  return (
    <Script
      id="anti-adblock-script"
      src="/vidstuck.js"
      strategy="afterInteractive"
    />
  );
}
