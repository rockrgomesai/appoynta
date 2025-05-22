import { TextEncoder, TextDecoder } from 'util';

if (typeof window !== 'undefined') {
  if (!('TextEncoder' in window)) {
    (window as any).TextEncoder = TextEncoder;
  }
  if (!('TextDecoder' in window)) {
    (window as any).TextDecoder = TextDecoder;
  }
}

export { TextEncoder, TextDecoder };