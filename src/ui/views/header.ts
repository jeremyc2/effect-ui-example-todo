import { Context, Effect, Layer } from "effect";
import { html, type TemplateResult } from "lit-html";
import type { TodoSnapshot } from "../../todo/schema.ts";
import { TodoMetricView } from "./metric.ts";

/**
 * Renders the application heading and summary metrics for the current snapshot.
 */
export class TodoHeaderView extends Context.Service<
	TodoHeaderView,
	{
		readonly render: (snapshot: TodoSnapshot) => TemplateResult;
	}
>()("effect-ui-example-todo/ui/views/header/TodoHeaderView") {
	static readonly layer = Layer.effect(
		TodoHeaderView,
		Effect.gen(function* () {
			const metricView = yield* TodoMetricView;

			return TodoHeaderView.of({
				render: (snapshot) => html`
					<header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p class="text-sm font-medium uppercase tracking-wide text-cyan-300">Effect Lit</p>
							<h1 class="mt-1 text-3xl font-semibold text-white sm:text-4xl">Todo List</h1>
						</div>
						<div class="grid grid-cols-3 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
							${metricView.render("Total", snapshot.totalCount)}
							${metricView.render("Active", snapshot.activeCount)}
							${metricView.render("Done", snapshot.completedCount)}
						</div>
					</header>
				`,
			});
		}),
	);
}
