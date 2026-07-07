# Effect UI Example Todo

A small Todo app that demonstrates **Effect UI**, a strategy for building user interfaces with Effect and Lit HTML.

Effect UI keeps the app's state transitions, dependencies, and error handling in Effect services, while Lit HTML renders the interface as plain templates.

## What this shows

- An Effect-powered Todo domain model with commands, snapshots, and branded IDs.
- Layered services for the model, app shell, renderer, and individual views.
- Lit HTML templates for the browser-facing UI.
- A small dispatch loop that applies commands, creates a new snapshot, and renders it.
- Bun-powered local development with Tailwind styling.

## Project layout

- `src/todo/schema.ts` defines the Todo commands, state, snapshots, and item schema.
- `src/todo/model.ts` owns pure state transitions and snapshot derivation.
- `src/todo/app.ts` wraps the model in an Effect service with mutable app state.
- `src/ui/views/` contains Lit HTML view services.
- `src/ui/renderer.ts` renders snapshots into the DOM.
- `src/ui/shell.ts` connects DOM mounting, dispatch, and render updates.
- `src/layers.ts` wires the Effect service graph.

## Getting started

Install dependencies:

```sh
bun install
```

Start the dev server:

```sh
bun dev
```

Then open `http://localhost:3000`.

Build a static, server-rendered copy:

```sh
bun run build
```

The build writes `out/index.html` plus minified CSS and JavaScript assets under `out/assets`. The generated `out` directory is plain static HTML, CSS, and browser JavaScript, so it can be served from a CDN or any static file host without a Bun runtime.

## Quality checks

Run the TypeScript checker:

```sh
bun typecheck
```

Run Biome:

```sh
bun check
```

Update reference repositories:

```sh
bun references:update
```

## Effect UI

This example treats UI as a rendered projection of an Effect-managed domain:

1. User events create typed Todo commands.
2. The app service applies commands through the Todo model.
3. The model returns a new snapshot.
4. Lit HTML renders that snapshot.

That keeps view code focused on markup and event wiring, while Effect owns the parts that tend to become implicit in frontend apps: services, state changes, dependencies, and recoverable failures.
