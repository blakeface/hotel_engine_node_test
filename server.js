"use strict";

const Hapi = require("hapi");
const Inert = require("inert");
const Path = require("path");
const request = require("request");
const rp = require("request-promise-native");
const catboxMongodb = require("catbox-mongodb");

// create hapi server object
const server = Hapi.server({
	host: process.env.host || "localhost",
	port: process.env.port || "8080",
	routes: {
		files: {
			// 	keep all filepaths relative to public folder
			relativeTo: Path.join(__dirname, "public")
		}
	},
	cache: [
		{
			name: "mongoCache",
			engine: catboxMongodb,
			host: "127.0.0.1",
			partition: "hotel_engine_node_test"
		}
	]
});

// declare init command
const init = async () => {
	await server.register(Inert);

	// cache request object
	const makeApiCall = async () => {
		// make request and return results
		return await rp({
			url: "https://api.github.com/repos/juliangarnier/anime/pulls",
			headers: {
				"User-Agent": "hotel_engine_node_test", // name of repo
				Accept: "application/vnd.github.v3+json"
			}
		});
	};

	server.method("requestCache", makeApiCall, {
		cache: {
			cache: "mongoCache",
			expiresIn: 10 * 1000,
			generateTimeout: 2000,
			getDecoratedValue: true
		}
	});

	// define routes
	server.route([
		// http routes
		{
			method: "GET",
			path: "/",
			handler: async function(req, h) {
				// get cached gitHub request
				const { value, cached } = await server.methods.requestCache();
				console.log(
					`${
						cached
							? "last modified on " + new Date(cached.stored)
							: "freshly cached"
					}`
				);

				return h.file("index.html");
			}
		},
		// static files (css, js)
		{
			method: "GET",
			path: "/public/{param*}",
			handler: {
				directory: {
					path: Path.normalize(__dirname + "/public")
				}
			}
		}
	]);

	// start hapi server object
	await server.start();
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
	console.log(
		`Warning: ${warning.name}\n`,
		`${warning.message}\n`,
		warning.stack
	);
});

// FIRE IT UP!
init();
