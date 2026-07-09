import { Layer } from "effect";
import { TodoAppLive, TodoAppViewLive } from "./layers.ts";

export const ServerRenderLayer = Layer.suspend(() =>
	Layer.mergeAll(TodoAppLive, TodoAppViewLive),
);
