import { Layer } from "effect";
import { TodoAppLive, TodoAppViewLive } from "./layers.ts";
import { DomHtmlRendererLive } from "./ui/renderers/dom-html-renderer.ts";
import { TodoShell } from "./ui/shell.ts";

const ShellDependencies = Layer.mergeAll(TodoAppLive, DomHtmlRendererLive).pipe(
	Layer.provide(TodoAppViewLive),
);

export const AppLayer = TodoShell.layer.pipe(Layer.provide(ShellDependencies));
