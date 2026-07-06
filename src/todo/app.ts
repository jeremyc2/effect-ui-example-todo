import { Context, Effect, Layer, Ref } from "effect";
import { TodoModel } from "./model.ts";
import type { TodoCommand, TodoSnapshot } from "./schema.ts";

export class TodoApp extends Context.Service<
	TodoApp,
	{
		readonly snapshot: Effect.Effect<TodoSnapshot>;
		readonly execute: (command: TodoCommand) => Effect.Effect<TodoSnapshot>;
	}
>()("effect-lit-demo1/todo/app/TodoApp") {
	static readonly layer = Layer.effect(
		TodoApp,
		Effect.gen(function* () {
			const todoModel = yield* TodoModel;
			const state = yield* Ref.make(todoModel.initialState);

			const snapshot = Ref.get(state).pipe(Effect.map(todoModel.snapshot));

			const execute = Effect.fn("TodoApp.execute")(function* (
				command: TodoCommand,
			) {
				yield* Ref.update(state, (current) =>
					todoModel.apply(current, command),
				);
				return yield* snapshot;
			});

			return TodoApp.of({
				snapshot,
				execute,
			});
		}),
	);
}
