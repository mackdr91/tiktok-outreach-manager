/*
Author: Domonick Mack
Date: 2026-11-15
Description: Vitest configuration for unit and integration testing with path alias resolution.
*/

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
