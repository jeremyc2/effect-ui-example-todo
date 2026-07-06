import { Schema } from "effect";

export class MissingRootElementError extends Schema.TaggedErrorClass<MissingRootElementError>()(
	"MissingRootElementError",
	{
		selector: Schema.String,
	},
) {}

export class HtmlRenderError extends Schema.TaggedErrorClass<HtmlRenderError>()(
	"HtmlRenderError",
	{
		cause: Schema.Defect({ includeStack: true }),
	},
) {}
