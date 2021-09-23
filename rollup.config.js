import dts from "rollup-plugin-dts";
import esbuild from "rollup-plugin-esbuild";

const bundle = (config) => ({
  input: "src/index.ts",
  external: (id) => !/^[./]/.test(id),
  ...config,
});

const files = [
  { input: "index", output: "resty" },
  { input: "next", output: "next" },
];

const bundles = [];

files.forEach(({ input, output }) => {
  bundles.push(
    bundle({
      input: `src/${input}.ts`,
      plugins: [esbuild()],
      output: [
        {
          file: `dist/${output}.js`,
          format: "cjs",
        },
        {
          file: `dist/${output}.mjs`,
          format: "es",
        },
      ],
    }),
  );

  bundles.push(
    bundle({
      input: `src/${input}.ts`,
      plugins: [dts()],
      output: {
        file: `dist/${output}.d.ts`,
        format: "es",
      },
    }),
  );
});

export default bundles;
