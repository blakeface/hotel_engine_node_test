"use strict";

// modules
const Hapi = require("hapi");
const Inert = require("inert");
const Path = require("path");
const request = require("request");
const rp = require("request-promise");
const catboxMongodb = require("catbox-mongodb");
const fs = require("fs");

// helper variables
const pathToLogs = Path.join(__dirname, "logs");
const isDevMode = process.env.mode === "development";

// create hapi server object
const server = Hapi.server({
	host: process.env.host || "localhost",
	port: process.env.port || "8080",
	routes: {
		files: {
			// 	keep all filepaths relative to dist folder
			relativeTo: Path.join(__dirname, "dist")
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
	const makeApiCall = () => {
		const url = "https://api.github.com/repos/juliangarnier/anime/pulls";
		let data = [];

		return rp({
			url: url,
			headers: {
				"User-Agent": "hotel_engine_node_test", // name of repo
				Accept: "application/vnd.github.v3+json"
			},
			json: true
		})
			.then(results => {
				handleLog(`call to ${url}`);

				const promises = results.map(pull => {
					return rp({
						url: url + "/" + pull.number,
						headers: {
							"User-Agent": "hotel_engine_node_test", // name of repo
							Accept: "application/vnd.github.v3+json"
						}
					});
				});

				return Promise.all(promises);
			})
			.then(results => {
				handleLog(`finished promise chain`);
				return results;
			})
			.catch(err => {
				handleError(err);
				return err;
			});
	};

	server.method("requestCache", makeApiCall, {
		cache: {
			cache: "mongoCache",
			expiresIn: 1000 * 60 * 60 * 24, // each day
			generateTimeout: 1000 * 10, // ten seconds
			getDecoratedValue: true
		}
	});

	// define routes
	server.route([
		// http routes
		{
			method: "GET",
			path: "/",
			handler: (req, h) => h.file("index.html")
		},
		// api endpoints
		{
			method: "GET",
			path: "/api/data",
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
				return value;
			}
		},
		// static files (css, js)
		{
			method: "GET",
			path: "/{param*}",
			handler: {
				directory: {
					path: Path.normalize(__dirname + "/dist")
				}
			}
		}
	]);

	// start hapi server object
	await server.start();
};

// loggers
const handleError = err => {
	const message = `${new Date()} --- Error: \n${err.message} \n`;
	fs.writeFileSync(pathToLogs + "/errors.log", message, {
		flag: "a+"
	});

	// log in dev mode
	if (isDevMode) {
		console.log(message, err);
	}
};
const handleWarning = warning => {
	const message = `${new Date()} --- Warning: ${warning.name} \n${
		warning.message
	}\n`;
	fs.writeFileSync(pathToLogs + "/errors.log", message, {
		flag: "a+"
	});

	// log in dev mode
	if (isDevMode) {
		console.log(message, warning.stack);
	}
};
const handleLog = msg => {
	const message = `${new Date()} --- Success: \n ${msg} \n`;
	fs.writeFileSync(pathToLogs + "/api.log", message, {
		flag: "a+"
	});
};

// register event handler for errors and warnings
process.on("unhandledRejection", err => {
	handleError(err);
	process.exit(1);
});
process.on("warning", warning => {
	handleWarning(warning);
});

// Redirect all routes to index
server.ext("onPreResponse", (req, h) => {
	const { response } = req;
	// Boom is Hapi error library
	if (response.isBoom && response.output.statusCode === 404) {
		return h.file("index.html");
	}
	return h.continue;
});

// FIRE IT UP!
init();
