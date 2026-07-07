import { Layer } from "effect";
import { TodoApp } from "./todo/app.ts";
import { TodoIds, TodoModel } from "./todo/model.ts";
import {
	TodoAppView,
	TodoClearCompletedButtonView,
	TodoEmptyStateView,
	TodoFilterButtonView,
	TodoFilterControlsView,
	TodoFormView,
	TodoHeaderView,
	TodoItemsPanelView,
	TodoListView,
	TodoMetricView,
	TodoRowView,
	TodoToolbarView,
} from "./ui/views/index.ts";

const TodoModelLive = TodoModel.layer.pipe(Layer.provide(TodoIds.layer));
export const TodoAppLive = TodoApp.layer.pipe(Layer.provide(TodoModelLive));

const TodoHeaderViewLive = TodoHeaderView.layer.pipe(
	Layer.provide(TodoMetricView.layer),
);

const TodoFilterControlsViewLive = TodoFilterControlsView.layer.pipe(
	Layer.provide(TodoFilterButtonView.layer),
);

const TodoToolbarViewLive = TodoToolbarView.layer.pipe(
	Layer.provide(
		Layer.mergeAll(
			TodoFilterControlsViewLive,
			TodoClearCompletedButtonView.layer,
		),
	),
);

const TodoListViewLive = TodoListView.layer.pipe(
	Layer.provide(TodoRowView.layer),
);

const TodoItemsPanelViewLive = TodoItemsPanelView.layer.pipe(
	Layer.provide(Layer.mergeAll(TodoEmptyStateView.layer, TodoListViewLive)),
);

export const TodoAppViewLive = TodoAppView.layer.pipe(
	Layer.provide(
		Layer.mergeAll(
			TodoHeaderViewLive,
			TodoFormView.layer,
			TodoToolbarViewLive,
			TodoItemsPanelViewLive,
		),
	),
);
