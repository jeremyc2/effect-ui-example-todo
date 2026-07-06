import { Brand, Data, Schema } from "effect";

export type TodoFilter = "all" | "active" | "completed";
type NoFields = Record<never, never>;

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

export type TodoState = {
	readonly items: ReadonlyArray<TodoItem>;
	readonly nextId: number;
	readonly draft: string;
	readonly filter: TodoFilter;
};

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
