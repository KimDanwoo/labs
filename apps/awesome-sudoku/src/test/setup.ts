import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";

if (!global.structuredClone) {
  global.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

beforeEach(() => {
  vi.clearAllMocks();
});
