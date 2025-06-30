
require("dotenv").config({path: "../.env"})
const Logger = require("@ryanforever/logger").v4
const logger = new Logger(__filename, {debug: false})
const GithubWatcher = require("../src")

const watcher = new GithubWatcher({
	debug: true,
	port: 3001,
	notify: {
		user: process.env.PUSHOVER_USER,
		token: process.env.PUSHOVER_TOKEN,
		appName: "botlab"
	},
	apps: [
		{
			name: "butterbabybot",
			path: "~/code/deploy/bots/butterbabybot",
			// deployScript: "deploy.sh",
			// startScript: "npm start",
			active: true
		},
		{
			name: "botlab-framework-v4",
			path: "~/code/deploy/framework-v4",
			active: true
		},
		{
			name: "scripts",
			path: "~/code/deploy/scripts",
			startScript: "npm ci",
			active: true
		}
	]
})


// logger.log(watcher)

// watcher.run()