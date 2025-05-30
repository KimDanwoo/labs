import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock as unknown as Storage;

if (!global.structuredClone) {
  global.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

beforeEach(() => {
  vi.clearAllMocks();
});
