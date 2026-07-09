import { Layer } from "effect";
import { TodoAppLive, TodoAppViewLive } from "./layers.ts";
import { HydratingHtmlRendererLive } from "./ui/renderers/hydrating-html-renderer.ts";
import { TodoShell } from "./ui/shell.ts";

const ShellDependencies = Layer.suspend(() =>
	Layer.mergeAll(TodoAppLive, HydratingHtmlRendererLive).pipe(
		Layer.provide(TodoAppViewLive),
	),
);

export const AppLayer = Layer.suspend(() =>
	TodoShell.layer.pipe(Layer.provide(ShellDependencies)),
);
