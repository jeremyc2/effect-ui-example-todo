import { Context, Effect, Layer } from "effect";
import { html, type TemplateResult } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import type {
	DispatchTodoCommand,
	TodoItem,
	TodoSnapshot,
} from "../../todo/schema.ts";
import { TodoRowView } from "./row.ts";

export class TodoListView extends Context.Service<
	TodoListView,
	{
		readonly render: (
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
		) => TemplateResult;
	}
>()("effect-ui-example-todo/ui/views/list/TodoListView") {
	static readonly layer = Layer.effect(
		TodoListView,
		Effect.gen(function* () {
			const rowView = yield* TodoRowView;
			const todoKey = (todo: TodoItem) => todo.id;

			return TodoListView.of({
				render: (snapshot, dispatch) => html`
					<ul class="divide-y divide-zinc-800">
						${repeat(snapshot.visibleItems, todoKey, (todo) =>
							rowView.render(todo, dispatch),
						)}
					</ul>
				`,
			});
		}),
	);
}
