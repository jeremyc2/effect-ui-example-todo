import { Brand, Data, Schema } from "effect";

type NoFields = Record<never, never>;

export const TodoFilterSchema = Schema.Literals(["all", "active", "completed"]);
export type TodoFilter = Schema.Schema.Type<typeof TodoFilterSchema>;

export const TodoIdSchema = Schema.String.pipe(Schema.brand("TodoId"));
export type TodoId = Schema.Schema.Type<typeof TodoIdSchema>;
export const TodoId = Brand.nominal<TodoId>();

export type TodoCommand = Data.TaggedEnum<{
	DraftChanged: {
		readonly value: string;
	};
	DraftSubmitted: NoFields;
	TodoToggled: {
		readonly id: TodoId;
	};
	TodoDeleted: {
		readonly id: TodoId;
	};
	FilterChanged: {
		readonly filter: TodoFilter;
	};
	CompletedCleared: NoFields;
}>;

export const TodoCommand = Data.taggedEnum<TodoCommand>();

export class TodoItem extends Schema.Class<TodoItem>("TodoItem")({
	id: TodoIdSchema,
	title: Schema.String,
	completed: Schema.Boolean,
}) {}

export const TodoStateSchema = Schema.Struct({
	items: Schema.Array(TodoItem),
	nextId: Schema.Finite,
	draft: Schema.String,
	filter: TodoFilterSchema,
});
export type TodoState = Schema.Schema.Type<typeof TodoStateSchema>;

export type TodoSnapshot = {
	readonly items: ReadonlyArray<TodoItem>;
	readonly visibleItems: ReadonlyArray<TodoItem>;
	readonly draft: string;
	readonly filter: TodoFilter;
	readonly totalCount: number;
	readonly activeCount: number;
	readonly completedCount: number;
	readonly canSubmit: boolean;
	readonly canClearCompleted: boolean;
};

export type DispatchTodoCommand = (command: TodoCommand) => void;
