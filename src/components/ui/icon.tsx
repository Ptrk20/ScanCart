import type { SVGProps } from "react";

const paths = {
  home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  scan: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 8v8m3-8v8m4-8v8m3-8v8",
  basket: "m7 9 5-6 5 6M3 9h18l-2 11H5L3 9Zm6 4v3m6-3v3",
  history: "M3 11a9 9 0 1 1 2.6 7.4M3 4v7h7m2-4v5l3 2",
  store: "M3 10V4h18v6M3 7h18M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 13v8h14v-8m-9 8v-6h4v6",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  wallet: "M20 8V5H5a2 2 0 0 0 0 4h16v11H5a2 2 0 0 1-2-2V7m18 6h-5v3h5",
  leaf: "M20 3C9 2 3 7 5 14c2 7 15 5 15-11ZM4 21 15 10",
  bulb: "M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z",
  check: "m5 12 4 4L19 6",
} satisfies Record<string, string>;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-5", ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d={paths[name]} />
    </svg>
  );
}
