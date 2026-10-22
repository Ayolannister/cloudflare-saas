import type { SVGProps } from 'react';

const paths = {
  check: 'M3.5 8.5l3 3 6-7',
  plus: 'M8 3v10M3 8h10',
  clip: 'M10.5 4.5l-5 5a1.6 1.6 0 002.3 2.3l5.4-5.4a3 3 0 00-4.3-4.3L3.5 7.5a4.3 4.3 0 006.1 6.1l4-4',
  trash: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5',
  download: 'M8 2.5v8M4.5 7.5L8 11l3.5-3.5M3 13.5h10',
  upload: 'M8 11V3M4.5 6.5L8 3l3.5 3.5M3 13.5h10',
  close: 'M4 4l8 8M12 4l-8 8',
  pencil: 'M10.5 3l2.5 2.5L6 12.5H3.5V10z',
  file: 'M4 2.5h5l3 3v8H4z M9 2.5v3h3',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
