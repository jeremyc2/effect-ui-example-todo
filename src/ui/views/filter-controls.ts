import { Context, Effect, Layer } from "effect";
import { html, type TemplateResult } from "lit-html";
import type { DispatchTodoCommand, TodoSnapshot } from "../../todo/schema.ts";
import { TodoFilterButtonView } from "./filter-button.ts";

export class TodoFilterControlsView extends Context.Service<
	TodoFilterControlsView,
	{
		readonly render: (
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
		) => TemplateResult;
	}
>()("effect-ui-example-todo/ui/views/filter-controls/TodoFilterControlsView") {
	static readonly layer = Layer.effect(
		TodoFilterControlsView,
		Effect.gen(function* () {
			const filterButtonView = yield* TodoFilterButtonView;

			return TodoFilterControlsView.of({
				render: (snapshot, dispatch) => html`
					<div class="grid grid-cols-3 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
						${filterButtonView.render(snapshot, dispatch, "All", "all")}
						${filterButtonView.render(snapshot, dispatch, "Active", "active")}
						${filterButtonView.render(snapshot, dispatch, "Done", "completed")}
					</div>
				`,
			});
		}),
	);
}
