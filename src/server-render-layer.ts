import { Layer } from "effect";
import { TodoAppLive, TodoAppViewLive } from "./layers.ts";

export const ServerRenderLayer = Layer.mergeAll(TodoAppLive, TodoAppViewLive);
