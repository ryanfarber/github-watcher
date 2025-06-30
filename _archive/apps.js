
const App = require("./App.js")


let apps = [
	{
		name: "butterbabybot",
		path: "~/code/deploy/butterbabybot",
		deployScript: "deploy.sh",
		active: true
	}
]




let map = new Map()
apps.map(x => new App(x)).forEach(app => map.set(app.name, app))

module.exports = map