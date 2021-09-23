import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import { readdir } from "fs/promises";
import esbuild from "esbuild";
import Mocha from "mocha";

const __dirname = fileURLToPath(dirname(import.meta.url));
const outputDirName = "dist";
const inputDir = resolve(__dirname);
const outputDir = resolve(__dirname, outputDirName);

const buildTests = async () => {
  const filenames = await readdir(inputDir);
  const testFilenames = filenames.filter(
    (f) =>
      f.endsWith(".test.js") ||
      f.endsWith(".test.mjs") ||
      f.endsWith(".test.ts")
  );

  if (testFilenames.length !== 0) {
    const filesToBuild = testFilenames.map((f) => join(inputDir, f));
    return esbuild.build({
      entryPoints: filesToBuild,
      outdir: outputDirName,
      bundle: true,
      platform: "node",
      target: ["node16"],
      logLevel: "silent",
    });
  }
};

const runTests = async () => {
  const filenames = await readdir(outputDir);
  const testFilenames = filenames.filter((f) => f.endsWith(".test.js"));

  if (testFilenames.length === 0) {
    return null;
  }

  const mocha = new Mocha({
    ui: "bdd",
    reporter: "json",
  });

  for (const filename of testFilenames) {
    const fileToTest = join(outputDir, filename);
    mocha.addFile(fileToTest);
  }

  const write = process.stdout.write;
  process.stdout.write = () => {};

  return new Promise((resolve) => {
    const runner = mocha.run(() => {
      process.stdout.write = write;
      resolve(JSON.stringify(runner.testResults, null, 2));
    });
  });
};

const report = async (testResults) => {
  let result = {
    verdict: "Ok",
    compilationOutput: "",
    output: "",
    error: "",
  };
  if (testResults && testResults.failures && testResults.failures.length > 0) {
    const failure = testResults.failures[0];
    result = {
      verdict: "Ok",
      compilationOutput: "",
      output: `${failure.fullTitle}: ${failure.err.message}`,
      error: "",
    };
  }
  console.info(JSON.stringify(result));
};

const compilationFailed = (error) => {
  const result = {
    verdict: "CompilationError",
    compilationOutput: error.message,
    output: "",
    error: "",
  };
  console.info(JSON.stringify(result));
};

const main = async () => {
  try {
    await buildTests();
  } catch (compilationError) {
    return compilationFailed(compilationError);
  }
  const testResults = await runTests();
  await report(testResults);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
