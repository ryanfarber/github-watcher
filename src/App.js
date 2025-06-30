



const fs = require("fs")
const path = require("path")


function App(config = {}) {
	this.name = config.name
	this.path = config.path
	this.deployScript = config.deployScript
	this.startScript = config.startScript
	this.deployScriptPath = undefined
	this.active = config.active ?? false

	if (!this.name) throw new Error(`app must have github repo name`)
	if (!this.path) throw new Error(`app must have deploy path`)

	if (this.deployScript) this.deployScriptPath = path.join(this.path, this.deployScript)
}

module.exports = App