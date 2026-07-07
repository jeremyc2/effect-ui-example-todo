import { Context, Layer } from "effect";
import { html, type TemplateResult } from "lit-html";
import {
	type DispatchTodoCommand,
	TodoCommand,
	type TodoItem,
} from "../../todo/schema.ts";

/**
 * Renders a single todo row with completion and delete interactions.
 */
export class TodoRowView extends Context.Service<
	TodoRowView,
	{
		readonly render: (
			todo: TodoItem,
			dispatch: DispatchTodoCommand,
		) => TemplateResult;
	}
>()("effect-ui-example-todo/ui/views/row/TodoRowView") {
	static readonly layer = Layer.sync(TodoRowView)(() =>
		TodoRowView.of({
			render: (todo, dispatch) => html`
				<li class="grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
					<input
						class="size-5 accent-cyan-300"
						type="checkbox"
						.checked=${todo.completed}
						aria-label=${
							todo.completed
								? `Mark ${todo.title} active`
								: `Mark ${todo.title} complete`
						}
						@change=${() => dispatch(TodoCommand.TodoToggled({ id: todo.id }))}
					/>
					<span class=${todo.completed ? "text-zinc-500 line-through" : "text-zinc-100"}>
						${todo.title}
					</span>
					<button
						class="min-h-9 rounded-md px-3 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-rose-200"
						type="button"
						aria-label=${`Delete ${todo.title}`}
						@click=${() => dispatch(TodoCommand.TodoDeleted({ id: todo.id }))}
					>
						Delete
					</button>
				</li>
			`,
		}),
	);
}
