import { Context, Effect, Layer } from "effect";
import { html, type TemplateResult } from "lit-html";
import type { DispatchTodoCommand, TodoSnapshot } from "../../todo/schema.ts";
import { TodoFormView } from "./form.ts";
import { TodoHeaderView } from "./header.ts";
import { TodoItemsPanelView } from "./items-panel.ts";
import { TodoToolbarView } from "./toolbar.ts";

export class TodoAppView extends Context.Service<
	TodoAppView,
	{
		readonly render: (
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
		) => TemplateResult;
	}
>()("effect-lit-demo1/ui/views/app-view/TodoAppView") {
	static readonly layer = Layer.effect(
		TodoAppView,
		Effect.gen(function* () {
			const headerView = yield* TodoHeaderView;
			const formView = yield* TodoFormView;
			const toolbarView = yield* TodoToolbarView;
			const itemsPanelView = yield* TodoItemsPanelView;

			return TodoAppView.of({
				render: (snapshot, dispatch) => html`
					<main class="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 lg:px-8">
						<section class="mx-auto flex w-full max-w-3xl flex-col gap-5">
							${headerView.render(snapshot)}
							${formView.render(snapshot, dispatch)}
							${toolbarView.render(snapshot, dispatch)}
							${itemsPanelView.render(snapshot, dispatch)}
						</section>
					</main>
				`,
			});
		}),
	);
}
