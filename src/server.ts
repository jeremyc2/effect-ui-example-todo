import index from "./index.html";

const server = Bun.serve({
	development: true,
	port: 3000,
	routes: {
		"/": index,
	},
});

await Bun.write(Bun.stdout, `Server running at ${server.url}\n`);
