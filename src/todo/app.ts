import { Context, Effect, Layer } from "effect";
import { AppState } from "../app-state.ts";
import { TodoModel } from "./model.ts";
import {
	type TodoCommand,
	type TodoSnapshot,
	type TodoState,
	TodoStateSchema,
} from "./schema.ts";

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
			const appState = yield* AppState;
			const todoModel = yield* TodoModel;
			const todoState = yield* appState.entry({
				key: "todo",
				schema: TodoStateSchema,
				initial: todoModel.initialState,
			});

			const currentState = todoState.get;
			const snapshot = currentState.pipe(Effect.map(todoModel.snapshot));

			const execute = Effect.fn("TodoApp.execute")(function* (
				command: TodoCommand,
			) {
				const next = yield* todoState.update((current) =>
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
