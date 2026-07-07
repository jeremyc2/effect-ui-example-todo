import { Context, Effect, Layer } from "effect";
import { html, type TemplateResult } from "lit-html";
import type { DispatchTodoCommand, TodoSnapshot } from "../../todo/schema.ts";
import { TodoClearCompletedButtonView } from "./clear-completed-button.ts";
import { TodoFilterControlsView } from "./filter-controls.ts";

/**
 * Renders the todo toolbar by composing filter controls with bulk actions.
 */
export class TodoToolbarView extends Context.Service<
	TodoToolbarView,
	{
		readonly render: (
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
		) => TemplateResult;
	}
>()("effect-ui-example-todo/ui/views/toolbar/TodoToolbarView") {
	static readonly layer = Layer.effect(
		TodoToolbarView,
		Effect.gen(function* () {
			const filterControlsView = yield* TodoFilterControlsView;
			const clearCompletedButtonView = yield* TodoClearCompletedButtonView;

			return TodoToolbarView.of({
				render: (snapshot, dispatch) => html`
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						${filterControlsView.render(snapshot, dispatch)}
						${clearCompletedButtonView.render(snapshot, dispatch)}
					</div>
				`,
			});
		}),
	);
}
