import { Context, Layer } from "effect";
import { html, type TemplateResult } from "lit-html";
import type { TodoFilter } from "../../todo/schema.ts";

export class TodoEmptyStateView extends Context.Service<
	TodoEmptyStateView,
	{
		readonly render: (filter: TodoFilter) => TemplateResult;
	}
>()("effect-ui-example-todo/ui/views/empty-state/TodoEmptyStateView") {
	static readonly layer = Layer.sync(TodoEmptyStateView)(() => {
		const messageByFilter = {
			all: "No tasks yet.",
			active: "No active tasks.",
			completed: "No completed tasks.",
		} satisfies Record<TodoFilter, string>;

		return TodoEmptyStateView.of({
			render: (filter) =>
				html`<p class="px-4 py-10 text-center text-sm text-zinc-400">${messageByFilter[filter]}</p>`,
		});
	});
}
