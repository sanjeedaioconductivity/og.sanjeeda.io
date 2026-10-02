import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  // `.claude/**` covers agent worktrees — each is a full copy of this repo, so
  // without it every problem in the project is reported twice (once from the
  // real file, once from the copy), and the copies' generated `.next` output is
  // linted too, since the `.next/**` pattern above only matches at the root.
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/**",
  ]
}];

export default eslintConfig;
