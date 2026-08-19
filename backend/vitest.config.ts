import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// No explicit root: it defaults to this file's directory, and setting it
		// broke discovery when the root config loads this as a project.
		include: ["src/**/*.test.ts"],
		environment: "node",
	},
	// No transformer plugin on purpose. vitest's esbuild honours
	// experimentalDecorators but cannot emit `design:paramtypes`, so Nest's DI
	// container would fail to resolve constructor parameters here. Tests build
	// their subjects with `new` instead of `Test.createTestingModule`, which needs
	// no metadata and no native toolchain — the module wiring itself is verified
	// by booting the app, not by a unit test.
});
