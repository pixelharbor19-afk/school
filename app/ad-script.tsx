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
    typeof window !== "undefined" &&
    (window.location.hostname === "zxcstream.icu" ||
      window.location.hostname.endsWith(".zxcstream.icu"))
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
