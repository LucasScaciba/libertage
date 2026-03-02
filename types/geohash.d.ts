declare module 'geohash' {
  export function encode(latitude: number, longitude: number, precision?: number): string;
  export function decode(hashstring: string): { latitude: number; longitude: number };
  export function decode_bbox(hashstring: string): [number, number, number, number];
  export function neighbor(hashstring: string, direction: string): string;
  export function neighbors(hashstring: string): string[];
  export function bboxes(minlat: number, minlon: number, maxlat: number, maxlon: number, precision?: number): string[];
}
