import { Effect, Layer } from "effect";
import { render, type TemplateResult } from "lit-html";
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
	Effect.try({
		try: () => render(appView.render(snapshot, dispatch), root),
		catch: (error) =>
			HtmlRenderError.make({
				cause: error,
			}),
	});

export const DomHtmlRendererLive = Layer.effect(
	HtmlRenderer,
	Effect.gen(function* () {
		const appView = yield* TodoAppView;

		return HtmlRenderer.of({
			mount: (root, snapshot, dispatch) =>
				renderIntoRoot(root, snapshot, dispatch, appView),
			render: (root, snapshot, dispatch) =>
				renderIntoRoot(root, snapshot, dispatch, appView),
		});
	}),
);
