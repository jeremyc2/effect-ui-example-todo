import { Context, Layer } from "effect";
import { html, type TemplateResult } from "lit-html";
import {
	type DispatchTodoCommand,
	TodoCommand,
	type TodoSnapshot,
} from "../../todo/schema.ts";

export class TodoClearCompletedButtonView extends Context.Service<
	TodoClearCompletedButtonView,
	{
		readonly render: (
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
		) => TemplateResult;
	}
>()(
	"effect-ui-example-todo/ui/views/clear-completed-button/TodoClearCompletedButtonView",
) {
	static readonly layer = Layer.sync(TodoClearCompletedButtonView)(() =>
		TodoClearCompletedButtonView.of({
			render: (snapshot, dispatch) => html`
				<button
					class="min-h-10 rounded-md border border-zinc-700 px-4 text-sm font-medium text-zinc-200 transition hover:border-rose-300 hover:text-rose-200 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
					type="button"
					?disabled=${!snapshot.canClearCompleted}
					@click=${() => dispatch(TodoCommand.CompletedCleared())}
				>
					Clear completed
				</button>
			`,
		}),
	);
}
