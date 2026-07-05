import { Console, Effect, Schema } from "effect";
import { html, render } from "lit-html";

class MissingRootElementError extends Schema.TaggedErrorClass<MissingRootElementError>()(
	"MyError",
	{
		selector: Schema.String,
	},
) {}

class HtmlRenderError extends Schema.TaggedErrorClass<HtmlRenderError>()(
	"MyError",
	{
		cause: Schema.Defect({ includeStack: true }),
	},
) {}

const program = Effect.gen(function* () {
	yield* Console.log("hello world");

	const selector = "#root";
	const root = document.querySelector<HTMLElement>(selector);
	if (root === null) {
		return yield* MissingRootElementError.make({
			selector,
		});
	}

	return yield* Effect.try({
		try: () => {
			render(
				html`<div class="p-6 text-2xl font-semibold text-sky-700">Hello World</div>`,
				root,
			);
		},
		catch: (error) =>
			HtmlRenderError.make({
				cause: error,
			}),
	});
});

Effect.runPromise(program);

if (import.meta.hot !== undefined) {
	import.meta.hot.accept();
}
