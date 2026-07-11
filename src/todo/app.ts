import { Context, Effect, Layer, Ref } from "effect";
import { State } from "otaku-state";
import { TodoModel } from "./model.ts";
import type { TodoCommand, TodoSnapshot, TodoState } from "./schema.ts";

/**
 * Manages the live todo application state and executes todo commands against
 * the model.
 */
export class TodoApp extends Context.Service<
	TodoApp,
	{
		readonly state: Effect.Effect<TodoState>;
		readonly snapshot: Effect.Effect<TodoSnapshot>;
		readonly execute: (command: TodoCommand) => Effect.Effect<TodoSnapshot>;
	}
>()("effect-ui-example-todo/todo/app/TodoApp") {
	static readonly layer = Layer.effect(
		TodoApp,
		Effect.gen(function* () {
			const state = yield* State;
			const todoModel = yield* TodoModel;
			const todoState = yield* state.make({
				key: "todo",
				initial: todoModel.initialState,
			});

			const currentState = Ref.get(todoState);
			const snapshot = currentState.pipe(Effect.map(todoModel.snapshot));

			const execute = Effect.fn("TodoApp.execute")(function* (
				command: TodoCommand,
			) {
				const next = yield* Ref.updateAndGet(todoState, (current) =>
					todoModel.apply(current, command),
				);
				return todoModel.snapshot(next);
			});

			return TodoApp.of({
				state: currentState,
				snapshot,
				execute,
			});
		}),
	);
}
