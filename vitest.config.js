"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        environment: "node",
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/",
                "dist/",
                "**/*.test.ts",
                "**/*.spec.ts",
                "src/index.ts",
                "src/functions/**",
                "src/scripts/**",
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 75,
                statements: 80,
            },
        },
        testTimeout: 30000,
        hookTimeout: 30000,
        include: ["src/__tests__/**/*.test.ts"],
    },
});
//# sourceMappingURL=vitest.config.js.map