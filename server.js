"use strict";

const Hapi = require("hapi");
const Path = require("path");
const Inert = require("inert");

// create hapi server object
const server = Hapi.server({
	host: process.env.host || "localhost",
	port: process.env.port || "8080",
	routes: {
		files: {
			relativeTo: Path.join(__dirname, "public"),
		},
	},
});

// declare init command
const init = async () => {
	await server.register(Inert);

	// define routes
	server.route({
		method: "GET",
		path: "/{param*}",
		handler: {
			file: "index.html",
		},
	});

	// start hapi server object
	await server.start();
	console.log(`Haii! Server running at: ${server.info.uri}`);
};

// Redirect all routes to index
server.ext("onPreResponse", (req, h) => {
	const { response } = req;
	// Boom is Hapi error library
	if (response.isBoom && response.output.statusCode === 404) {
		return h.file("index.html");
	}
	return h.continue;
});

// event handler for errors and warning
process.on("unhandledRejection", err => {
	console.log("Error:\n", `${err.message}\n`, err);
	process.exit(1);
});
process.on("warning", warning => {
	console.log(`Warning: ${warning.name}\n`, `${warning.message}\n`, warning.stack);
});

// FIRE IT UP!
init();
