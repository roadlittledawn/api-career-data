import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["dist/index.js"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/bundle.mjs",
  external: ["@aws-sdk/*"],
  banner: {
    js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
  },
});

console.log("Bundle created successfully");
