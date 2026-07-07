import { Context, Effect, Layer } from "effect";
import { render } from "lit-html";
import { HtmlRenderError } from "../todo/errors.ts";
import type { DispatchTodoCommand, TodoSnapshot } from "../todo/schema.ts";
import { TodoAppView } from "./views/index.ts";

/**
 * Renders the todo application template into a DOM root and maps rendering
 * failures into typed todo UI errors.
 */
export class HtmlRenderer extends Context.Service<
	HtmlRenderer,
	{
		readonly render: (
			root: HTMLElement,
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
		) => Effect.Effect<void, HtmlRenderError>;
	}
>()("effect-ui-example-todo/ui/renderer/HtmlRenderer") {
	static readonly layer = Layer.effect(
		HtmlRenderer,
		Effect.gen(function* () {
			const appView = yield* TodoAppView;

			const renderTodoApp = (
				root: HTMLElement,
				snapshot: TodoSnapshot,
				dispatch: DispatchTodoCommand,
			) =>
				Effect.try({
					try: () => render(appView.render(snapshot, dispatch), root),
					catch: (error) =>
						HtmlRenderError.make({
							cause: error,
						}),
				});

			return HtmlRenderer.of({
				render: renderTodoApp,
			});
		}),
	);
}
