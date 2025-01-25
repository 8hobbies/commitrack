import configs from "@8hobbies/eslint-conf-baseline";
import globals from "globals";

export default [
  ...configs.recommended,
  {
    files: ["src/**.ts", "*.ts"],
    ignores: configs.ignores,
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: ["tsconfig.prod.json", "tsconfig.test.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
