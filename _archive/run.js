// run.js


require("dotenv").config({path: "../../.env"})
const Logger = require("@ryanforever/logger").v4
const logger = new Logger("watcher.run", {debug: false})
const bus = require("./bus.js")
let apps = require("./apps.js")

const deploy = require("./deploy.js")
const Notify = require("@ryanforever/notify")
const notify = new Notify({
	user: process.env.PUSHOVER_USER,
	token: process.env.PUSHOVER_TOKEN,
	appName: "botlab"
})

require("./server.js")

let activeApps = Array.from(apps.values()).filter(app => app.active)

logger.log(`watching ${activeApps.length} app(s):  ${activeApps.map(x => x.name).join(", ")}`)
logger.log(activeApps)


bus.on("deploy", data => {
	// logger.log(data)
	let repoName = data.repository.name
	logger.log(`new push from "${repoName}"`)

	let app = apps.get(repoName)
	if (app) {
		notify(`app: ${app.name}`, {title: "DEPLOYMENT STARTED"}).then(logger.log)
		deploy(app)
	} else {
		logger.error(`"${repoName}" is not an active app, please registed this in the apps list`)
	}
})

bus.on("done", data => {
	notify(`app: ${data.app.name}`, {title: "APP DEPLOYED"})
})
