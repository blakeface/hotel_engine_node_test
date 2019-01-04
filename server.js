"use strict";

const Hapi = require("hapi");
const Inert = require("inert");
const Path = require("path");
const request = require("request");
const rp = require("request-promise");
const catboxMongodb = require("catbox-mongodb");

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
	debug: {
		request: ["error"]
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

		const client_id = "0f51dae017fae2754f7e";
		const client_secret = "324f6d0388360cf1c298a7e1703685d349ae59ba";
		const authString = `?client_id=${client_id}&client_secret=${client_secret}`;

		return rp({
			url: url + authString,
			headers: {
				"User-Agent": "hotel_engine_node_test", // name of repo
				Accept: "application/vnd.github.v3+json"
			},
			json: true
		})
			.then(results => {
				// save data for future use
				data = results.map(pull => ({
					user: {
						name: pull.user.login,
						avatar: pull.user.avatar_url
					},
					id: pull.number
				}));

				return data;
			})
			.then(data => {
				// get information about all pull requests
				const promises = data.map(pull => {
					return rp({
						url: url + "/" + pull.id + authString,
						headers: {
							"User-Agent": "hotel_engine_node_test", // name of repo
							Accept: "application/vnd.github.v3+json"
						}
					});
				});

				return Promise.all(promises);
			})
			.then(results => ({
				users: data,
				pulls: results
			}))
			.catch(err => console.log(err));
	};

	server.method("requestCache", makeApiCall, {
		cache: {
			cache: "mongoCache",
			expiresIn: 10 * 1000,
			generateTimeout: 10 * 1000,
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
