import {
	Brand,
	Console,
	Context,
	Data,
	Effect,
	Layer,
	ManagedRuntime,
	Ref,
	Schema,
} from "effect";
import { html, render, type TemplateResult } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";

type TodoFilter = "all" | "active" | "completed";
type NoFields = Record<never, never>;

const TodoIdSchema = Schema.String.pipe(Schema.brand("TodoId"));
type TodoId = Schema.Schema.Type<typeof TodoIdSchema>;
const TodoId = Brand.nominal<TodoId>();

type TodoCommand = Data.TaggedEnum<{
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

const TodoCommand = Data.taggedEnum<TodoCommand>();

class TodoItem extends Schema.Class<TodoItem>("TodoItem")({
	id: TodoIdSchema,
	title: Schema.String,
	completed: Schema.Boolean,
}) {}

class MissingRootElementError extends Schema.TaggedErrorClass<MissingRootElementError>()(
	"MissingRootElementError",
	{
		selector: Schema.String,
	},
) {}

class HtmlRenderError extends Schema.TaggedErrorClass<HtmlRenderError>()(
	"HtmlRenderError",
	{
		cause: Schema.Defect({ includeStack: true }),
	},
) {}

type TodoState = {
	readonly items: ReadonlyArray<TodoItem>;
	readonly nextId: number;
	readonly draft: string;
	readonly filter: TodoFilter;
};

type TodoSnapshot = {
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

type DispatchTodoCommand = (command: TodoCommand) => void;

class TodoIds extends Context.Service<
	TodoIds,
	{
		readonly fromSeed: (value: string) => TodoId;
		readonly fromSequence: (value: number) => TodoId;
	}
>()("effect-lit-demo1/TodoIds") {
	static readonly layer = Layer.succeed(TodoIds)({
		fromSeed: TodoId,
		fromSequence: (value) => TodoId(`todo-${value}`),
	});
}

class TodoModel extends Context.Service<
	TodoModel,
	{
		readonly initialState: TodoState;
		readonly apply: (state: TodoState, command: TodoCommand) => TodoState;
		readonly snapshot: (state: TodoState) => TodoSnapshot;
	}
>()("effect-lit-demo1/TodoModel") {
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

class TodoApp extends Context.Service<
	TodoApp,
	{
		readonly snapshot: Effect.Effect<TodoSnapshot>;
		readonly execute: (command: TodoCommand) => Effect.Effect<TodoSnapshot>;
	}
>()("effect-lit-demo1/TodoApp") {
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

class TodoComponents extends Context.Service<
	TodoComponents,
	{
		readonly app: (
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
		) => TemplateResult;
	}
>()("effect-lit-demo1/TodoComponents") {
	static readonly layer = Layer.sync(TodoComponents)(() => {
		const metric = (label: string, value: number) => html`
				<div class="min-w-20 border-r border-zinc-800 px-3 py-2 text-center last:border-r-0">
					<div class="text-lg font-semibold text-white">${value}</div>
					<div class="text-xs text-zinc-400">${label}</div>
				</div>
			`;

		const filterButton = (
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
			label: string,
			filter: TodoFilter,
		) => html`
				<button
					class=${
						snapshot.filter === filter
							? "min-h-9 rounded-md bg-white px-3 text-sm font-semibold text-zinc-950"
							: "min-h-9 rounded-md px-3 text-sm font-medium text-zinc-300 transition hover:text-white"
					}
					type="button"
					aria-pressed=${snapshot.filter === filter}
					@click=${() => dispatch(TodoCommand.FilterChanged({ filter }))}
				>
					${label}
				</button>
			`;

		const messageByFilter = {
			all: "No tasks yet.",
			active: "No active tasks.",
			completed: "No completed tasks.",
		} satisfies Record<TodoFilter, string>;

		const emptyState = (filter: TodoFilter) =>
			html`<p class="px-4 py-10 text-center text-sm text-zinc-400">${messageByFilter[filter]}</p>`;

		const row = (dispatch: DispatchTodoCommand, todo: TodoItem) => html`
				<li class="grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
					<input
						class="size-5 accent-cyan-300"
						type="checkbox"
						.checked=${todo.completed}
						aria-label=${
							todo.completed
								? `Mark ${todo.title} active`
								: `Mark ${todo.title} complete`
						}
						@change=${() => dispatch(TodoCommand.TodoToggled({ id: todo.id }))}
					/>
					<span class=${todo.completed ? "text-zinc-500 line-through" : "text-zinc-100"}>
						${todo.title}
					</span>
					<button
						class="min-h-9 rounded-md px-3 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-rose-200"
						type="button"
						aria-label=${`Delete ${todo.title}`}
						@click=${() => dispatch(TodoCommand.TodoDeleted({ id: todo.id }))}
					>
						Delete
					</button>
				</li>
			`;

		const todoKey = (todo: TodoItem) => todo.id;

		const list = (
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
		) => html`
				<ul class="divide-y divide-zinc-800">
					${repeat(snapshot.visibleItems, todoKey, (todo) => row(dispatch, todo))}
				</ul>
			`;

		return TodoComponents.of({
			app: (snapshot, dispatch) => html`
				<main class="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 lg:px-8">
					<section class="mx-auto flex w-full max-w-3xl flex-col gap-5">
						<header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<p class="text-sm font-medium uppercase tracking-wide text-cyan-300">Effect Lit</p>
								<h1 class="mt-1 text-3xl font-semibold text-white sm:text-4xl">Todo List</h1>
							</div>
							<div class="grid grid-cols-3 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
								${metric("Total", snapshot.totalCount)}
								${metric("Active", snapshot.activeCount)}
								${metric("Done", snapshot.completedCount)}
							</div>
						</header>

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

						<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div class="grid grid-cols-3 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
								${filterButton(snapshot, dispatch, "All", "all")}
								${filterButton(snapshot, dispatch, "Active", "active")}
								${filterButton(snapshot, dispatch, "Done", "completed")}
							</div>
							<button
								class="min-h-10 rounded-md border border-zinc-700 px-4 text-sm font-medium text-zinc-200 transition hover:border-rose-300 hover:text-rose-200 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
								type="button"
								?disabled=${!snapshot.canClearCompleted}
								@click=${() => dispatch(TodoCommand.CompletedCleared())}
							>
								Clear completed
							</button>
						</div>

						<section class="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
							${
								snapshot.visibleItems.length === 0
									? emptyState(snapshot.filter)
									: list(snapshot, dispatch)
							}
						</section>
					</section>
				</main>
			`,
		});
	});
}

class HtmlRenderer extends Context.Service<
	HtmlRenderer,
	{
		readonly render: (
			root: HTMLElement,
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
		) => Effect.Effect<void, HtmlRenderError>;
	}
>()("effect-lit-demo1/HtmlRenderer") {
	static readonly layer = Layer.effect(
		HtmlRenderer,
		Effect.gen(function* () {
			const todoComponents = yield* TodoComponents;

			const renderTodoApp = (
				root: HTMLElement,
				snapshot: TodoSnapshot,
				dispatch: DispatchTodoCommand,
			) =>
				Effect.try({
					try: () => render(todoComponents.app(snapshot, dispatch), root),
					catch: (error) =>
						HtmlRenderError.make({
							cause: error,
						}),
				});

			return HtmlRenderer.of({
				render: renderTodoApp,
			});
		}),
	);
}

class TodoShell extends Context.Service<
	TodoShell,
	{
		readonly mount: (
			selector: string,
		) => Effect.Effect<void, MissingRootElementError | HtmlRenderError>;
	}
>()("effect-lit-demo1/TodoShell") {
	static readonly layer = Layer.effect(
		TodoShell,
		Effect.gen(function* () {
			const todoApp = yield* TodoApp;
			const htmlRenderer = yield* HtmlRenderer;
			const context = yield* Effect.context<TodoApp | HtmlRenderer>();
			const runPromise = Effect.runPromiseWith(context);

			const mount = Effect.fn("TodoShell.mount")(function* (selector: string) {
				const root = document.querySelector<HTMLElement>(selector);
				if (root === null) {
					return yield* MissingRootElementError.make({ selector });
				}

				const dispatch: DispatchTodoCommand = (command) => {
					void runPromise(
						todoApp.execute(command).pipe(
							Effect.flatMap((snapshot) =>
								htmlRenderer.render(root, snapshot, dispatch),
							),
							Effect.catchTag("HtmlRenderError", (error) =>
								Console.error("Unable to render the todo app", error),
							),
						),
					);
				};

				const snapshot = yield* todoApp.snapshot;
				yield* htmlRenderer.render(root, snapshot, dispatch);
			});

			return TodoShell.of({
				mount,
			});
		}),
	);
}

const TodoModelLive = TodoModel.layer.pipe(Layer.provide(TodoIds.layer));
const TodoAppLive = TodoApp.layer.pipe(Layer.provide(TodoModelLive));
const HtmlRendererLive = HtmlRenderer.layer.pipe(
	Layer.provide(TodoComponents.layer),
);
const ShellDependencies = Layer.mergeAll(TodoAppLive, HtmlRendererLive);
const AppLayer = TodoShell.layer.pipe(Layer.provide(ShellDependencies));
const runtime = ManagedRuntime.make(AppLayer);

const program = TodoShell.use((shell) => shell.mount("#root"));

void runtime.runPromise(
	program.pipe(
		Effect.catchTags({
			MissingRootElementError: (error) =>
				Console.error(
					`Could not find root element for selector ${error.selector}`,
				),
			HtmlRenderError: (error) =>
				Console.error("Could not render the initial todo app", error),
		}),
	),
);

if (import.meta.hot !== undefined) {
	import.meta.hot.accept();
}
