import { Context, Effect, Layer } from "effect";
import {
	TodoCommand,
	type TodoFilter,
	TodoId,
	TodoItem,
	type TodoSnapshot,
	type TodoState,
} from "./schema.ts";

export class TodoIds extends Context.Service<
	TodoIds,
	{
		readonly fromSeed: (value: string) => TodoId;
		readonly fromSequence: (value: number) => TodoId;
	}
>()("effect-lit-demo1/todo/model/TodoIds") {
	static readonly layer = Layer.succeed(TodoIds)({
		fromSeed: TodoId,
		fromSequence: (value) => TodoId(`todo-${value}`),
	});
}

export class TodoModel extends Context.Service<
	TodoModel,
	{
		readonly initialState: TodoState;
		readonly apply: (state: TodoState, command: TodoCommand) => TodoState;
		readonly snapshot: (state: TodoState) => TodoSnapshot;
	}
>()("effect-lit-demo1/todo/model/TodoModel") {
	static readonly layer = Layer.effect(
		TodoModel,
		Effect.gen(function* () {
			const todoIds = yield* TodoIds;

			const normalizeTitle = (title: string) => title.trim();

			const createTodo = (id: TodoId, title: string) =>
				TodoItem.make({
					id,
					title,
					completed: false,
				});

			const matchesFilter = (filter: TodoFilter) => (todo: TodoItem) => {
				switch (filter) {
					case "all": {
						return true;
					}
					case "active": {
						return !todo.completed;
					}
					case "completed": {
						return todo.completed;
					}
				}
			};

			const replaceTodo =
				(id: TodoId, update: (todo: TodoItem) => TodoItem) =>
				(items: ReadonlyArray<TodoItem>) =>
					items.map((todo) => (todo.id === id ? update(todo) : todo));

			const initialState: TodoState = {
				items: [
					TodoItem.make({
						id: todoIds.fromSeed("todo-1"),
						title: "Sketch the domain language",
						completed: true,
					}),
					TodoItem.make({
						id: todoIds.fromSeed("todo-2"),
						title: "Keep the interface small",
						completed: false,
					}),
				],
				nextId: 3,
				draft: "",
				filter: "all",
			};

			const apply = (state: TodoState, command: TodoCommand): TodoState =>
				TodoCommand.$match(command, {
					DraftChanged: ({ value }) => ({
						...state,
						draft: value,
					}),
					DraftSubmitted: () => {
						const title = normalizeTitle(state.draft);

						if (title.length === 0) {
							return state;
						}

						return {
							...state,
							items: [
								...state.items,
								createTodo(todoIds.fromSequence(state.nextId), title),
							],
							nextId: state.nextId + 1,
							draft: "",
						};
					},
					TodoToggled: ({ id }) => ({
						...state,
						items: replaceTodo(id, (todo) =>
							TodoItem.make({
								id: todo.id,
								title: todo.title,
								completed: !todo.completed,
							}),
						)(state.items),
					}),
					TodoDeleted: ({ id }) => ({
						...state,
						items: state.items.filter((todo) => todo.id !== id),
					}),
					FilterChanged: ({ filter }) => ({
						...state,
						filter,
					}),
					CompletedCleared: () => ({
						...state,
						items: state.items.filter((todo) => !todo.completed),
					}),
				});

			const snapshot = (state: TodoState): TodoSnapshot => {
				const activeCount = state.items.filter(
					(todo) => !todo.completed,
				).length;
				const completedCount = state.items.length - activeCount;

				return {
					items: state.items,
					visibleItems: state.items.filter(matchesFilter(state.filter)),
					draft: state.draft,
					filter: state.filter,
					totalCount: state.items.length,
					activeCount,
					completedCount,
					canSubmit: normalizeTitle(state.draft).length > 0,
					canClearCompleted: completedCount > 0,
				};
			};

			return TodoModel.of({
				initialState,
				apply,
				snapshot,
			});
		}),
	);
}
