const ALLOWED_REFERERS = [
  "http://192.168.1.4:3000/",
  "http://localhost:3000/",
  //
  "https://vidstuck.xyz/",
  "https://embed.vidstuck.xyz/",

  "https://player.zxcstream.xyz/",
  "https://player.zxcprime.xyz",
];

export const ALLOWED_ORIGINS = [
  "http://192.168.1.4:3000",
  "http://localhost:3000",
  //
  "https://vidstuck.xyz",
  "https://embed.vidstuck.xyz",

  "https://player.zxcstream.xyz",
  "https://player.zxcprime.xyz",
];
export function isValidReferer(referer: string): boolean {
  return ALLOWED_REFERERS.some((allowed) => referer.includes(allowed));
}
