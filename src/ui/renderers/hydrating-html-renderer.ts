import { hydrate } from "@lit-labs/ssr-client";
import { Effect, Layer } from "effect";
import type { TemplateResult } from "lit-html";
import { HtmlRenderError } from "../../todo/errors.ts";
import type { DispatchTodoCommand, TodoSnapshot } from "../../todo/schema.ts";
import { HtmlRenderer } from "../html-renderer.ts";
import { TodoAppView } from "../views/index.ts";

type TodoAppViewService = {
	readonly render: (
		snapshot: TodoSnapshot,
		dispatch: DispatchTodoCommand,
	) => TemplateResult;
};

const renderIntoRoot = (
	root: HTMLElement,
	snapshot: TodoSnapshot,
	dispatch: DispatchTodoCommand,
	appView: TodoAppViewService,
) =>
	Effect.tryPromise({
		// @effect-diagnostics-next-line asyncFunction:off -- Async function in Effect.tryPromise is allowed.
		try: async () => {
			const { renderLitTemplate } = await import("./render-lit-template.ts");
			return renderLitTemplate(root, appView.render(snapshot, dispatch));
		},
		catch: (error) =>
			HtmlRenderError.make({
				cause: error,
			}),
	});

const hydrateRoot = (
	root: HTMLElement,
	snapshot: TodoSnapshot,
	dispatch: DispatchTodoCommand,
	appView: TodoAppViewService,
) =>
	Effect.try({
		try: () => hydrate(appView.render(snapshot, dispatch), root),
		catch: (error) =>
			HtmlRenderError.make({
				cause: error,
			}),
	});

export const HydratingHtmlRendererLive = Layer.effect(
	HtmlRenderer,
	Effect.gen(function* () {
		const appView = yield* TodoAppView;

		return HtmlRenderer.of({
			mount: (root, snapshot, dispatch) =>
				hydrateRoot(root, snapshot, dispatch, appView),
			render: (root, snapshot, dispatch) =>
				renderIntoRoot(root, snapshot, dispatch, appView),
		});
	}),
);
