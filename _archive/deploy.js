// deploy.js

const {exec, spawn} = require("child_process")
const bus = require("./bus.js")
const Logger = require("@ryanforever/logger").v4
const logger = new Logger("watcher.deploy", {debug: false})
const kindof = require("kind-of")

async function deploy(app) {
	if (!app || !app.name) throw new Error(`deploy() takes an app object.  got ${kindof(app)}`)
	logger.log(`deploying: "${app.name}"...`)

	let command = [
		`cd ${app.path}`,
		"echo 'pulling git repo...'",
		"git fetch origin main",
		"git reset --hard origin/main",
		"echo 'installing npm packages...'",
		"npm ci",
	]
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
		logger.log(`deploy completed with code ${code} ✅`)
		bus.emit("done", {
			app,
			code
		})
	})
	
}

module.exports = deploy



/* OLD
async function deploy(app) {
	logger.log(`deploying: "${app.name}"...`)

	let command = [
		`cd ${app.path}`,
		"git fetch origin main",
		"git reset --hard origin/main",
		"npm ci", 
	]
	command = command.join(" && ")
	command = `zsh -i -c \"${command}\"`
// console.log(command)
// return
	console.log(process.env)

	let options = {
		// cwd: app.path,
		// shell: "/bin/zsh",
		// shell: true,
		
		env: process.env
	}

	exec(command, options, (err, stdout, stderr) => {
		if (err) {
			console.error("DEPLOY ERROR\n",)
			console.error("STDERR:")
			console.error(stderr)
			console.log()
			console.error("ERR:")
			console.error(err)
			return
		}
		logger.log("DEPLOY OUTPUT:")
		logger.log(stdout)
	})
}

*/
