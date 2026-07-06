import { Console, Context, Effect, Layer } from "effect";
import { TodoApp } from "../todo/app.ts";
import {
	type HtmlRenderError,
	MissingRootElementError,
} from "../todo/errors.ts";
import type { DispatchTodoCommand } from "../todo/schema.ts";
import { HtmlRenderer } from "./renderer.ts";

export class TodoShell extends Context.Service<
	TodoShell,
	{
		readonly mount: (
			selector: string,
		) => Effect.Effect<void, MissingRootElementError | HtmlRenderError>;
	}
>()("effect-ui-example-todo/ui/shell/TodoShell") {
	static readonly layer = Layer.effect(
		TodoShell,
		Effect.gen(function* () {
			const todoApp = yield* TodoApp;
			const htmlRenderer = yield* HtmlRenderer;
			const context = yield* Effect.context<TodoApp | HtmlRenderer>();
			const runPromise = Effect.runPromiseWith(context);

			const mount = Effect.fn("TodoShell.mount")(function* (selector: string) {
				const root = document.querySelector<HTMLElement>(selector);
				if (root === null) {
					return yield* MissingRootElementError.make({ selector });
				}

				const dispatch: DispatchTodoCommand = (command) => {
					void runPromise(
						todoApp.execute(command).pipe(
							Effect.flatMap((snapshot) =>
								htmlRenderer.render(root, snapshot, dispatch),
							),
							Effect.catchTag("HtmlRenderError", (error) =>
								Console.error("Unable to render the todo app", error),
							),
						),
					);
				};

				const snapshot = yield* todoApp.snapshot;
				yield* htmlRenderer.render(root, snapshot, dispatch);
			});

			return TodoShell.of({
				mount,
			});
		}),
	);
}
