import { Context, Effect, Layer, Ref, Schema } from "effect";

type HotData = {
	appState?: Record<string, unknown>;
};

const hmrAppStateHotData = import.meta.hot.data as HotData;
hmrAppStateHotData.appState ??= {};
const hmrAppStateStorage = hmrAppStateHotData.appState;

export type AppStateEntry<T> = {
	readonly get: Effect.Effect<T>;
	readonly set: (next: T) => Effect.Effect<void>;
	readonly update: (change: (current: T) => T) => Effect.Effect<T>;
};

type AppStateOptions<T> = {
	readonly key: string;
	readonly schema: Schema.ConstraintDecoder<T, never>;
	readonly initial: T;
};

const isAppStateHmrEnabled = () => import.meta.hot !== undefined;

export class StateStorage extends Context.Service<
	StateStorage,
	{
		readonly get: (key: string) => Effect.Effect<unknown | undefined>;
		readonly set: (key: string, value: unknown) => Effect.Effect<void>;
	}
>()("effect-ui-example-todo/app-state/StateStorage") {
	static readonly layer = Layer.succeed(StateStorage)({
		get: (key) =>
			Effect.sync(() => {
				if (!isAppStateHmrEnabled()) {
					return undefined;
				}

				return hmrAppStateStorage[key];
			}),
		set: (key, value) =>
			Effect.sync(() => {
				if (!isAppStateHmrEnabled()) {
					return;
				}

				hmrAppStateStorage[key] = value;
			}),
	});
}

const decodeStoredState = <T>(
	schema: Schema.ConstraintDecoder<T, never>,
	stored: unknown,
	initial: T,
) => {
	if (stored === undefined) {
		return Effect.succeed(initial);
	}

	return Schema.decodeUnknownEffect(schema)(stored);
};

export class AppState extends Context.Service<
	AppState,
	{
		readonly entry: <T>(
			options: AppStateOptions<T>,
		) => Effect.Effect<AppStateEntry<T>>;
	}
>()("effect-ui-example-todo/app-state/AppState") {
	static readonly layer = Layer.effect(
		AppState,
		Effect.gen(function* () {
			const storage = yield* StateStorage;
			const entries = new Map<string, AppStateEntry<unknown>>();

			const entry = <T>({ key, schema, initial }: AppStateOptions<T>) =>
				Effect.gen(function* () {
					const existing = entries.get(key) as AppStateEntry<T> | undefined;
					if (existing !== undefined) {
						return existing;
					}

					const stored = yield* storage.get(key);
					const initialState = yield* decodeStoredState(
						schema,
						stored,
						initial,
					).pipe(Effect.catchTag("SchemaError", () => Effect.succeed(initial)));
					const ref = yield* Ref.make(initialState);
					yield* storage.set(key, initialState);

					const appStateEntry: AppStateEntry<T> = {
						get: Ref.get(ref),
						set: (next) =>
							Effect.gen(function* () {
								yield* Ref.set(ref, next);
								yield* storage.set(key, next);
							}),
						update: (change) =>
							Effect.gen(function* () {
								const next = yield* Ref.updateAndGet(ref, change);
								yield* storage.set(key, next);
								return next;
							}),
					};

					entries.set(key, appStateEntry as AppStateEntry<unknown>);
					return appStateEntry;
				});

			return AppState.of({
				entry,
			});
		}),
	);
}

export const AppStateLive = AppState.layer.pipe(
	Layer.provide(StateStorage.layer),
);
