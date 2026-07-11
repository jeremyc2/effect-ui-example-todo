import { Layer } from "effect";
import { State } from "otaku-state";
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

const TodoModelLive = Layer.suspend(() =>
	TodoModel.layer.pipe(Layer.provide(TodoIds.layer)),
);
export const TodoAppLive = Layer.suspend(() =>
	TodoApp.layer.pipe(Layer.provide(Layer.mergeAll(TodoModelLive, State.layer))),
);

const TodoHeaderViewLive = Layer.suspend(() =>
	TodoHeaderView.layer.pipe(Layer.provide(TodoMetricView.layer)),
);

const TodoFilterControlsViewLive = Layer.suspend(() =>
	TodoFilterControlsView.layer.pipe(Layer.provide(TodoFilterButtonView.layer)),
);

const TodoToolbarViewLive = Layer.suspend(() =>
	TodoToolbarView.layer.pipe(
		Layer.provide(
			Layer.mergeAll(
				TodoFilterControlsViewLive,
				TodoClearCompletedButtonView.layer,
			),
		),
	),
);

const TodoListViewLive = Layer.suspend(() =>
	TodoListView.layer.pipe(Layer.provide(TodoRowView.layer)),
);

const TodoItemsPanelViewLive = Layer.suspend(() =>
	TodoItemsPanelView.layer.pipe(
		Layer.provide(Layer.mergeAll(TodoEmptyStateView.layer, TodoListViewLive)),
	),
);

export const TodoAppViewLive = Layer.suspend(() =>
	TodoAppView.layer.pipe(
		Layer.provide(
			Layer.mergeAll(
				TodoHeaderViewLive,
				TodoFormView.layer,
				TodoToolbarViewLive,
				TodoItemsPanelViewLive,
			),
		),
	),
);
