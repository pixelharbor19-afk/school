const ALLOWED_REFERERS = [
  "http://192.168.1.4:3000/",
  "http://localhost:3000/",
  //
  "https://vidstuck.xyz/",
];

export const ALLOWED_ORIGINS = [
  "http://192.168.1.4:3000",
  "http://localhost:3000",
  //
  "https://vidstuck.xyz",
];
export function isValidReferer(referer: string): boolean {
  return ALLOWED_REFERERS.some((allowed) => referer.includes(allowed));
}
