// Vitest qlobal test setup (B.2/C.1: RTL komponent testləri üçün).
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Hər testdən sonra DOM-u təmizlə (test izolyasiyası).
afterEach(() => cleanup());
