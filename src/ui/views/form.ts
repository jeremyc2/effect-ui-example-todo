import { Context, Layer } from "effect";
import { html, type TemplateResult } from "lit-html";
import {
	type DispatchTodoCommand,
	TodoCommand,
	type TodoSnapshot,
} from "../../todo/schema.ts";

export class TodoFormView extends Context.Service<
	TodoFormView,
	{
		readonly render: (
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
		) => TemplateResult;
	}
>()("effect-lit-demo1/ui/views/form/TodoFormView") {
	static readonly layer = Layer.sync(TodoFormView)(() =>
		TodoFormView.of({
			render: (snapshot, dispatch) => html`
				<form
					class="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 sm:flex-row"
					@submit=${(event: SubmitEvent) => {
						event.preventDefault();
						dispatch(TodoCommand.DraftSubmitted());
					}}
				>
					<input
						class="min-h-11 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
						.value=${snapshot.draft}
						placeholder="Add a task"
						aria-label="Add a task"
						@input=${(event: InputEvent) => {
							const input = event.currentTarget;
							if (input instanceof HTMLInputElement) {
								dispatch(TodoCommand.DraftChanged({ value: input.value }));
							}
						}}
					/>
					<button
						class="min-h-11 rounded-md bg-cyan-300 px-5 font-semibold text-zinc-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
						type="submit"
						?disabled=${!snapshot.canSubmit}
					>
						Add
					</button>
				</form>
			`,
		}),
	);
}
