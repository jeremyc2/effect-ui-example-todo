import * as BunRuntime from "@effect/platform-bun/BunRuntime";
import * as BunServices from "@effect/platform-bun/BunServices";
import { renderThunked } from "@lit-labs/ssr";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";
import tailwind from "bun-plugin-tailwind";
import { Console, Effect, Layer, ManagedRuntime, Schema } from "effect";
import { Command } from "effect/unstable/cli";
import { ServerRenderLayer } from "../src/server-render-layer.ts";
import { TodoApp } from "../src/todo/app.ts";
import { TodoAppView } from "../src/ui/views/index.ts";

class StaticBuildError extends Schema.TaggedErrorClass<StaticBuildError>()(
	"StaticBuildError",
	{
		message: Schema.String,
		details: Schema.optional(Schema.String),
		cause: Schema.optional(Schema.Defect({ includeStack: true })),
	},
) {}

const outDirectory = "out";
const assetsDirectory = `${outDirectory}/assets`;
const browserAssetPrefix = "./assets/";

const renderServerApp = Effect.gen(function* () {
	const todoApp = yield* TodoApp;
	const appView = yield* TodoAppView;
	const snapshot = yield* todoApp.snapshot;

	return yield* Effect.tryPromise({
		try: () => collectResult(renderThunked(appView.render(snapshot, () => {}))),
		catch: (error) =>
			StaticBuildError.make({
				message: "Unable to server-render the todo app",
				cause: error,
			}),
	});
});

const findBuiltAsset = (
	outputs: ReadonlyArray<Bun.BuildArtifact>,
	contentType: string,
) => {
	const output = outputs.find((artifact) =>
		artifact.type.startsWith(contentType),
	);
	if (output === undefined) {
		return Effect.fail(
			StaticBuildError.make({
				message: `Bun did not emit a ${contentType} asset`,
				details: outputs.map((artifact) => artifact.path).join(", "),
			}),
		);
	}

	const pathParts = output.path.split("/");
	const fileName = pathParts.at(-1);
	if (fileName === undefined || fileName.length === 0) {
		return Effect.fail(
			StaticBuildError.make({
				message: `Could not derive an asset file name for ${output.path}`,
				details: output.path,
			}),
		);
	}

	return Effect.succeed(`${browserAssetPrefix}${fileName}`);
};

const validateBrowserAssetPath = (assetPath: string) =>
	Effect.gen(function* () {
		if (!assetPath.startsWith(browserAssetPrefix)) {
			return yield* StaticBuildError.make({
				message: "Generated browser asset path is malformed",
				details: assetPath,
			});
		}

		const filePath = `${outDirectory}/${assetPath.slice(2)}`;
		const exists = yield* Effect.tryPromise({
			try: () => Bun.file(filePath).exists(),
			catch: (error) =>
				StaticBuildError.make({
					message: "Unable to verify generated browser asset",
					details: filePath,
					cause: error,
				}),
		});

		if (!exists) {
			return yield* StaticBuildError.make({
				message: "Generated browser asset does not exist",
				details: filePath,
			});
		}
	});

const writeStaticDocument = (
	html: string,
	scriptPath: string,
	stylePath: string,
) =>
	Effect.tryPromise({
		try: () =>
			Bun.write(
				`${outDirectory}/index.html`,
				`<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Effect Lit Demo</title>
		<link rel="stylesheet" href="${stylePath}" />
	</head>
	<body>
		<div id="root">${html}</div>
		<script type="module" src="${scriptPath}"></script>
	</body>
</html>
`,
			),
		catch: (error) =>
			StaticBuildError.make({
				message: "Unable to write out/index.html",
				cause: error,
			}),
	});

const removeOutDirectory = Effect.tryPromise({
	try: () => Bun.$`rm -rf ${outDirectory}`,
	catch: (error) =>
		StaticBuildError.make({
			message: "Unable to clean the output directory",
			cause: error,
		}),
});

const buildStaticAssets = Effect.tryPromise({
	// @effect-diagnostics-next-line asyncFunction:off -- Async function in Effect.tryPromise is allowed.
	try: async () => {
		const result = await Bun.build({
			entrypoints: ["./src/static-client.ts", "./src/style.css"],
			format: "esm",
			minify: true,
			naming: {
				asset: "[name]-[hash].[ext]",
				chunk: "chunks/[name]-[hash].[ext]",
				entry: "[name]-[hash].[ext]",
			},
			outdir: assetsDirectory,
			plugins: [tailwind],
			splitting: true,
			target: "browser",
		});
		if (!result.success) {
			throw result.logs;
		}

		return result.outputs;
	},
	catch: (error) =>
		StaticBuildError.make({
			message: "Unable to bundle static assets",
			cause: error,
		}),
});

const buildProgram = Effect.gen(function* () {
	const runtime = ManagedRuntime.make(ServerRenderLayer);

	const html = yield* Effect.tryPromise({
		try: () => runtime.runPromise(renderServerApp),
		catch: (error) =>
			StaticBuildError.make({
				message: "Unable to run the server renderer",
				cause: error,
			}),
	}).pipe(Effect.ensuring(Effect.promise(() => runtime.dispose())));

	yield* removeOutDirectory;
	const outputs = yield* buildStaticAssets;
	const scriptPath = yield* findBuiltAsset(outputs, "text/javascript");
	const stylePath = yield* findBuiltAsset(outputs, "text/css");

	yield* validateBrowserAssetPath(scriptPath);
	yield* validateBrowserAssetPath(stylePath);
	yield* writeStaticDocument(html, scriptPath, stylePath);
	yield* Console.log(`Built static app in ${outDirectory}`);
});

const build = Command.make("build").pipe(
	Command.withHandler(() => buildProgram),
	Command.withDescription("Build the todo app into static files in out"),
);

Command.run(build, { version: "1.0.0" }).pipe(
	// @effect-diagnostics-next-line strictEffectProvide:off -- This is an application boundary.
	Effect.provide(Layer.mergeAll(BunServices.layer)),
	BunRuntime.runMain,
);
