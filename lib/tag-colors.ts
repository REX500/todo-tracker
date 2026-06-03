export function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export interface TagColor {
  color: string;
  background: string;
  border: string;
}

// Golden-angle spread keeps similar tag strings visually distinct.
export function tagColors(tag: string): TagColor {
  const spreadHue = (hashStr(tag.toLowerCase()) * 137.508) % 360;
  return {
    color: `hsl(${spreadHue}, 75%, 70%)`,
    background: `hsl(${spreadHue}, 50%, 14%)`,
    border: `hsl(${spreadHue}, 45%, 28%)`
  };
}
