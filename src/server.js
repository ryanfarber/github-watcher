

const Logger = require("@ryanforever/logger").v4
const logger = new Logger("watcher.server", {debug: false})
const path = require("path")
const express = require("express")
const app = express()
const utils = require("@ryanforever/express-utils")
const bus = require("./bus.js")
const {exec, spawn} = require("child_process")
const App = require("./App.js")
const {sendStatus, routeLogger} = require("@ryanforever/express-utils")



app.use(routeLogger({
	ignore: ["/ping", "/health"]
}))
app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.disable("x-powered-by")


app.get("/",sendStatus(200))
app.get("/ping", sendStatus(200))
app.get("/health", sendStatus(200))
app.post("/deploy", (req, res) => {
	res.sendStatus(200)
	let data = req.body
	bus.emit("deploy", data)
	bus.emit("push", data)
})

app.all("*", (req, res) => res.sendStatus(404))




function serve(port = 3001) {
	const listener = app.listen(port, () => {
		logger.log(`github watcher listening on port ${listener.address().port}`)
	})
}


module.exports = serve