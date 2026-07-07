import { Context, type Effect } from "effect";
import type { HtmlRenderError } from "../todo/errors.ts";
import type { DispatchTodoCommand, TodoSnapshot } from "../todo/schema.ts";

/**
 * Browser-side rendering operations for the todo app. Implementations can
 * choose whether initial mounting uses plain rendering or SSR hydration.
 */
export class HtmlRenderer extends Context.Service<
	HtmlRenderer,
	{
		readonly mount: (
			root: HTMLElement,
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
		) => Effect.Effect<void, HtmlRenderError>;
		readonly render: (
			root: HTMLElement,
			snapshot: TodoSnapshot,
			dispatch: DispatchTodoCommand,
		) => Effect.Effect<void, HtmlRenderError>;
	}
>()("effect-ui-example-todo/ui/html-renderer/HtmlRenderer") {}
