import { Context, Effect, Layer } from "effect";
import { html, type TemplateResult } from "lit-html";
import type { DispatchTodoCommand, TodoSnapshot } from "../../todo/schema.ts";
import { TodoEmptyStateView } from "./empty-state.ts";
import { TodoListView } from "./list.ts";

export class TodoItemsPanelView extends Context.Service<
	TodoItemsPanelView,
	{
		readonly render: (
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
		) => TemplateResult;
	}
>()("effect-lit-demo1/ui/views/items-panel/TodoItemsPanelView") {
	static readonly layer = Layer.effect(
		TodoItemsPanelView,
		Effect.gen(function* () {
			const emptyStateView = yield* TodoEmptyStateView;
			const listView = yield* TodoListView;

			return TodoItemsPanelView.of({
				render: (snapshot, dispatch) => html`
					<section class="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
						${
							snapshot.visibleItems.length === 0
								? emptyStateView.render(snapshot.filter)
								: listView.render(snapshot, dispatch)
						}
					</section>
				`,
			});
		}),
	);
}
