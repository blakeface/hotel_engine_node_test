const Hapi = require("hapi");

// init Hapi server
const server = Hapi.server({
	host: "localhost",
	port: "8080",
});

// routes
server.route({
	method: "GET",
	path: "/",
	handler: (req, h) => "hello",
});

// declare start command and fire up the server
const start = async () => {
	try {
		await server.start();
	} catch (err) {
		console.log("Error starting server:\n", err);
		process.exit(1);
	}

	console.log(`Server running at ${server.info.uri}`);
};
start();
