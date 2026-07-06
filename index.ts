import { Console, Effect, ManagedRuntime } from "effect";
import { AppLayer } from "./src/layers.ts";
import { TodoShell } from "./src/ui/shell.ts";

const runtime = ManagedRuntime.make(AppLayer);

const program = TodoShell.use((shell) => shell.mount("#root"));

void runtime.runPromise(
	program.pipe(
		Effect.catchTags({
			MissingRootElementError: (error) =>
				Console.error(
					`Could not find root element for selector ${error.selector}`,
				),
			HtmlRenderError: (error) =>
				Console.error("Could not render the initial todo app", error),
		}),
	),
);

if (import.meta.hot !== undefined) {
	import.meta.hot.accept();
}
