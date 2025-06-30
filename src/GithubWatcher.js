

const {exec, spawn} = require("child_process")
const bus = require("./bus.js")
const Logger = require("@ryanforever/logger").v4

const kindof = require("kind-of")
const EventEmitter = require("events")
const Notify = require("@ryanforever/notify")
const App = require("./App.js")


class GithubWatcher extends EventEmitter {
	constructor(config = {}) {
		super()
		const logger = new Logger("GithubWatcher", {debug: config.debug ?? false})

		let notifyConfig = config.notify || config.pushover
		let port = config.port || 3001
		let notify = {}

		if (notifyConfig) notify = new Notify(notifyConfig)

		this.apps = new Map()

		if (config.apps.length) {
			config.apps.map(x => new App(x)).forEach(app => this.apps.set(app.name, app))
		}


		// deployment done
		this.on("buildFinished", data => {
			if (notifyConfig) notify(`app: ${data.app.name}`, {title: "BUILD COMPLETED"})
		})

		// on push event from webhook
		bus.on("push", data => {
			this.emit("push", data)

			let repoName = data.repository.name
			logger.log(`new push from "${repoName}"`)

			let app = this.apps.get(repoName)
			if (app) {
				if (notifyConfig) notify(`app: ${app.name}`, {title: "BUILD STARTED"})
				this.deploy(app)
			} else {
				logger.error(`"${repoName}" is not an active app, please registed this in the apps list`)
			}
		})

		this.run = function() {
			logger.debug(`run`)

			displayTitle()
			let activeApps = Array.from(this.apps.values()).filter(app => app.active)

			logger.log(`👀 watching ${activeApps.length} app(s):  ${activeApps.map(x => x.name).join(", ")}`)
			logger.log(activeApps)

			const serve = require("./server.js")
			serve(port)
		}


		this.deploy = function(app) {
			logger.debug(`deploy`)

			if (!app || !app.name) throw new Error(`deploy() takes an app object.  got ${kindof(app)}`)
			logger.log(`deploying: "${app.name}"...`)

			let command = [
				`cd ${app.path}`,
				"echo 'pulling git repo...'",
				"git fetch origin main",
				"git reset --hard origin/main",
				// "echo 'installing npm packages...'",
				// "npm ci",
			]

			if (app.startScript) {
				command.push("echo 'running start script'",)
				command.push(app.startScript)
			}

			command = ["-i", "-c", command.join(" && ")]
			
			let options = {
				env: process.env,
				stdio: "inherit"
			}

			const child = spawn("zsh", command, options)


			child.on("error", err => {
				logger.error(`ERROR`)
				logger.error(err)
			})

			child.on("close", code => {
				logger.log(`build completed with code ${code} ✅`)
				this.emit("buildFinished", {
					app,
					code
				})
			})
		}

		function displayTitle() {
			let title = "# GITHUB WATCHER V1 #"
			let div = "#".repeat(title.length)
			console.log(`\n${div}\n${title}\n${div}\n`)
		}




	}
}



module.exports = GithubWatcher