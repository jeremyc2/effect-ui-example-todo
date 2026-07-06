import { Context, Layer } from "effect";
import { html, type TemplateResult } from "lit-html";
import {
	type DispatchTodoCommand,
	TodoCommand,
	type TodoFilter,
	type TodoSnapshot,
} from "../../todo/schema.ts";

export class TodoFilterButtonView extends Context.Service<
	TodoFilterButtonView,
	{
		readonly render: (
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
			label: string,
			filter: TodoFilter,
		) => TemplateResult;
	}
>()("effect-lit-demo1/ui/views/filter-button/TodoFilterButtonView") {
	static readonly layer = Layer.sync(TodoFilterButtonView)(() =>
		TodoFilterButtonView.of({
			render: (snapshot, dispatch, label, filter) => html`
				<button
					class=${
						snapshot.filter === filter
							? "min-h-9 rounded-md bg-white px-3 text-sm font-semibold text-zinc-950"
							: "min-h-9 rounded-md px-3 text-sm font-medium text-zinc-300 transition hover:text-white"
					}
					type="button"
					aria-pressed=${snapshot.filter === filter}
					@click=${() => dispatch(TodoCommand.FilterChanged({ filter }))}
				>
					${label}
				</button>
			`,
		}),
	);
}
