import * as esbuild from "esbuild";
import { execSync } from "child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const distDir = "dist";

// Clean dist directory
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true });
}
mkdirSync(distDir, { recursive: true });

// Bundle the application
await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/index.mjs",
  external: ["@aws-sdk/*"],
  minify: true,
  sourcemap: false,
  banner: {
    js: `import { createRequire } from 'module';import { fileURLToPath } from 'url';import { dirname } from 'path';const require = createRequire(import.meta.url);const __filename = fileURLToPath(import.meta.url);const __dirname = dirname(__filename);`,
  },
});

// Create package.json for Lambda (ES modules require this)
const lambdaPackageJson = {
  type: "module",
};
writeFileSync(
  join(distDir, "package.json"),
  JSON.stringify(lambdaPackageJson, null, 2)
);

console.log("✓ Bundle created successfully at dist/index.mjs");

// Create zip file for Lambda deployment if zip command is available
try {
  process.chdir(distDir);
  execSync("zip -r ../function.zip .", { stdio: "inherit" });
  process.chdir("..");
  console.log("✓ Lambda deployment package created at function.zip");
} catch {
  console.log(
    "⚠ Could not create zip file (zip command not available). Run manually: cd dist && zip -r ../function.zip ."
  );
}
