

const {exec, spawn} = require("child_process")
const bus = require("./bus.js")
const Logger = require("@ryanforever/logger").v4

const kindof = require("kind-of")
const EventEmitter = require("events")
const Notify = require("@ryanforever/notify")
const App = require("./App.js")
const Airtable = require("@ryanforever/airtable").v2


class GithubWatcher extends EventEmitter {
	constructor(config = {}) {
		super()
		const logger = new Logger("GithubWatcher", {debug: config.debug ?? false})

		let notifyConfig = config.notify || config.pushover
		let airtableConfig = config.airtable
		let useAirtable = config.useAirtable
		let port = config.port || 3001
		let notify = {}
		let airtable = {}

		if (notifyConfig) notify = new Notify(notifyConfig)
		if (airtableConfig) airtable = new Airtable(airtableConfig)

		this.apps = new Map()


		

		if (config?.apps?.length) {
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

		bus.on("configUpdated", app => {
			logger.log(`config updated: "${app.name}"`)
			this.emit("configUpdated", app)

			logger.log(app)
			this.apps.set(app.name, app)
		})

		this.run = async function() {
			logger.debug(`run`)

			displayTitle()

			const serve = require("./server.js")
			serve(port)
			if (airtableConfig) {
				logger.log(`using airtable`)
				await this.loadApps()
			}
			let activeApps = Array.from(this.apps.values()).filter(app => app.active)
			logger.log(`👀 watching ${activeApps.length} app(s):  ${activeApps.map(x => x.name).join(", ")}`)
			logger.log(activeApps)
		}


		this.deploy = function(app) {
			logger.debug(`deploy`)

			if (!app || !app.name) throw new Error(`deploy() takes an app object.  got ${kindof(app)}`)
			logger.log(`deploying: "${app.name}"...`)

			let command = [
				`cd ${app.path}`,
				"echo '\nWATCHER: pulling git repo...\n'",
				"git fetch origin main",
				"git reset --hard origin/main",
			]


			if (app.startScript) {
				command.push(`echo '\nWATCHER: running start script "${app.startScript}"\n'`,)
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

		this.loadApps = async function() {
			logger.debug(`loading apps from airtable...`)
			let apps = await airtable.get("github-watcher")
			apps = apps.map(x => x.fields)
			for (let app of apps) this.apps.set(app.name, app)
			logger.log(`${apps.length} apps loaded`)
		}

		

		function displayTitle() {
			let title = "# GITHUB WATCHER V1 #"
			let div = "#".repeat(title.length)
			console.log(`\n${div}\n${title}\n${div}\n`)
		}
	}
}



module.exports = GithubWatcher