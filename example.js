var AppConsole = require('./').AppConsole,
	 redis = require('redis');

var net = require('net');
var server = net.createServer();

server.on('connection', function (socket) {
	getApp(socket, socket);
});

server.listen(8124);

getApp();

function getApp(input, output) {
	var c = new AppConsole({ input : input || null, output : output || null, prompt : ["username"] });
	
	var rSubscriber = redis.createClient();
	var rPublisher = redis.createClient();
	
	rSubscriber.on("subscribe", function (channel, count) {
		c.writeln("");
		c.writeln("Subscribed to channel : " + channel);
		c.showPrompt();
	});
	
	rSubscriber.on("message", function (channel, message) {
		c.writeln("");
		c.writeln("[" + channel + "]" + message);
		c.showPrompt();
	});
	
	var channels = {};
	
	c.commands.push({
		"default" : function (un) {
			console.log("here: %s", un);
			c.prompt.pop(); //clear the username prompt;
			c.prompt.push("password"); //set the password prompt
			
			c.echo = false; //don't echo the password
			
			c.commands.push({
				"default" : function (pw) {
					if (un != pw) {
						c.writeln("");
						c.writeln("login failed");
						c.writeln("");
						
						c.pop();
						c.prompt.push("username");
						return;
					}
					c.writeln("welcome: " + un + " using password: " + pw);
					c.echo = true; //enable echoing again
					
					c.prompt.pop();//clear the password prompt
					
					c.commands.push({
						"channels" : function () {
							for (var x in channels) {
								c.writeln(x);
							}
						},
						"subscribe" : function () {
							var channel = Array.prototype.slice.call(arguments).join(' ')
							rSubscriber.subscribe(channel);
							channels[channel] = true;
						},
						"unsubscribe" : function () {
							var channel = Array.prototype.slice.call(arguments).join(' ')
							rSubscriber.unsubscribe(channel);
							delete channels[channel];
						},
						"publish" : function () {
							var channel = Array.prototype.slice.call(arguments).join(' ')
							
							c.push(channel, {
								"quit" : function () {
									c.prompt.pop();
									c.commands.pop();
								},
								"default" : function (str) {
									if (str && str != '') {
										rPublisher.publish(channel, "[" + un + "] " + str);
									}
								}
							});
						},
						"--" : function () {},
						"help" : function () {
							c.showHelp();
						},
						"exit" : function () {
							process.exit();
						},
						"" : function () { c.writeln("i dunno about that"); }
					});
				}
			});
		}
	});
	
	return c;
}

