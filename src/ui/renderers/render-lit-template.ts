import { render, type TemplateResult } from "lit-html";

export const renderLitTemplate = (
	root: HTMLElement,
	template: TemplateResult,
): void => {
	render(template, root);
};
