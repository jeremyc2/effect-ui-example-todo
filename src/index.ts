import { Console, Effect, ManagedRuntime } from "effect";
import { run } from "otaku-hmr";
import { AppLayer } from "./dev-client-layer.ts";
import { TodoShell } from "./ui/shell.ts";

const runtime = ManagedRuntime.make(AppLayer);

const program = TodoShell.use((shell) => shell.mount("#root")).pipe(
	Effect.catchTags({
		MissingRootElementError: (error) =>
			Console.error(
				`Could not find root element for selector ${error.selector}`,
			),
		HtmlRenderError: (error) =>
			Console.error("Could not render the initial todo app", error),
	}),
);

run(runtime, program);
