import { Console, Effect, ManagedRuntime } from "effect";
import { AppLayer } from "./client-layer.ts";
import { TodoShell } from "./ui/shell.ts";

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
				Console.error("Could not hydrate the todo app", error),
		}),
	),
);
