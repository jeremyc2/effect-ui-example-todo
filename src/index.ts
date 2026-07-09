import { Console, Effect, ManagedRuntime } from "effect";
import { AppLayer } from "./dev-client-layer.ts";
import { TodoShell } from "./ui/shell.ts";

const runtime = ManagedRuntime.make(AppLayer);
const hmrRuntimeData = import.meta.hot.data as { runtime?: typeof runtime };
const previousRuntime =
	import.meta.hot !== undefined ? hmrRuntimeData.runtime : undefined;

if (import.meta.hot !== undefined) {
	hmrRuntimeData.runtime = runtime;
}

const mountEffect = TodoShell.use((shell) => shell.mount("#root")).pipe(
	Effect.catchTags({
		MissingRootElementError: (error) =>
			Console.error(
				`Could not find root element for selector ${error.selector}`,
			),
		HtmlRenderError: (error) =>
			Console.error("Could not render the initial todo app", error),
	}),
);

const mount = () => runtime.runFork(mountEffect);

void mount();
previousRuntime?.runFork(previousRuntime.disposeEffect);

if (import.meta.hot !== undefined) {
	import.meta.hot.accept();
}
