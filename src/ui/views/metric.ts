import { Context, Layer } from "effect";
import { html, type TemplateResult } from "lit-html";

/**
 * Renders one numeric summary metric in the todo header.
 */
export class TodoMetricView extends Context.Service<
	TodoMetricView,
	{
		readonly render: (label: string, value: number) => TemplateResult;
	}
>()("effect-ui-example-todo/ui/views/metric/TodoMetricView") {
	static readonly layer = Layer.sync(TodoMetricView)(() =>
		TodoMetricView.of({
			render: (label, value) => html`
				<div class="min-w-20 border-r border-zinc-800 px-3 py-2 text-center last:border-r-0">
					<div class="text-lg font-semibold text-white">${value}</div>
					<div class="text-xs text-zinc-400">${label}</div>
				</div>
			`,
		}),
	);
}
