# github-watcher
this is a simple webhook server that watches for automated github deploys

## preliminary setup
1. you must have a public url for the github wwbhook to point to.  i usually use ngrok for this
2. add a webhook to your github repos that you want to watch.
3. you must initialize the folder where your app will deploy first.  i.e. `git clone git@github.com:<username>/<repo>`
4. add all your apps to the watcher, and run.


## usage
```javascript
require("dotenv").config({path: "../.env"})
const GithubWatcher = require("@ryanforever/github-watcher")


// instantiate a new watcher
const watcher = new GithubWatcher({
	// debug logging
	debug: true,

	// port that server will listen on
	port: 3001, 

	// optionally, provide pushover creds to notify you of deploys via the pushover app	
	pushover: {
		user: process.env.PUSHOVER_USER,
		token: process.env.PUSHOVER_TOKEN,
		appName: "watcher"
	},

	// add your apps here
	apps: [
		{
			name: "app1", // name of the app.  should match the name of the github repo
			path: "~/code/deploy/app1",	// path you want your app to deploy in
			startScript: "npm ci && npm start",  // optionally the script you want to run after deploy is finished
			active: true // watcher will ignore if inactive
		},
		{
			name: "app2",
			path: "~/code/deploy/app2",
			active: false
		},
		{
			name: "scripts",
			path: "~/code/deploy/scripts",
			startScript: "npm ci",
			active: true
		}
	]
})

// call .run() to start server
watcher.run()
```