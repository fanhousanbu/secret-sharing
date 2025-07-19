import '@testing-library/jest-dom';

// 模拟TextEncoder和TextDecoder
global.TextEncoder = class TextEncoder {
  encode(input: string): Uint8Array {
    const bytes = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
      bytes[i] = input.charCodeAt(i);
    }
    return bytes;
  }
} as any;

global.TextDecoder = class TextDecoder {
  decode(input: Uint8Array): string {
    return String.fromCharCode.apply(null, Array.from(input));
  }
} as any;

// 模拟window.crypto
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: jest.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      generateKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      importKey: jest.fn(),
      exportKey: jest.fn(),
      deriveKey: jest.fn(),
      digest: jest.fn(),
    },
  },
});

// 模拟File API
global.File = class File {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(
    bits: BlobPart[],
    name: string,
    options?: FilePropertyBag
  ) {
    this.name = name;
    this.size = bits.reduce((acc, bit) => acc + (bit as any).length || 0, 0);
    this.type = options?.type || '';
    this.lastModified = options?.lastModified || Date.now();
  }
} as any;



// 模拟FileReader
global.FileReader = class FileReader {
  onload: ((this: FileReader, ev: ProgressEvent) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent) => any) | null = null;
  onabort: ((this: FileReader, ev: ProgressEvent) => any) | null = null;
  onloadstart: ((this: FileReader, ev: ProgressEvent) => any) | null = null;
  onloadend: ((this: FileReader, ev: ProgressEvent) => any) | null = null;
  onprogress: ((this: FileReader, ev: ProgressEvent) => any) | null = null;
  readyState: number = 0;
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;

  readAsArrayBuffer(blob: Blob): void {
    setTimeout(() => {
      this.result = new ArrayBuffer(blob.size);
      this.onload?.(new ProgressEvent('load'));
    }, 0);
  }

  readAsText(_blob: Blob): void {
    setTimeout(() => {
      this.result = 'mock file content';
      this.onload?.(new ProgressEvent('load'));
    }, 0);
  }

  abort(): void {
    this.onabort?.(new ProgressEvent('abort'));
  }
} as any; 