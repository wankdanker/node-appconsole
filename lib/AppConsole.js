var map = require('dank-map')
	, keypress = require('keypress')
	;

module.exports = function (options) {
	return new AppConsole(options);
}

module.exports.AppConsole = AppConsole;

function AppConsole (options) {
	var options = options || {}, self = this;
	
	options.welcome = options.welcome || "Welcome to AppConsole.\n\r\n\r";
	options.promptSuffix = options.promptSuffix || "> ";
	
	var input = options.input || process.stdin;
	var output = options.output || process.stdout;
	var prompt = this.prompt = options.prompt || [];
	var commands = this.commands = options.commands || [];
	
	var inputBuffer = this.inputBuffer = [];
	var commandHistory = this.commandHistory = [];
	var commandIndex = this.commandIndex = 0;
	
	var arrowKeys = {
		'up' : true,
		'down' : true,
		'left' : true,
		'right' : true
	};
	
	this.echo = true;
	
	var processKey = this.processKey = function (chunk, next) {
		if (chunk.charCodeAt(0) > 255) {
			//TODO: process telnet return code.
			return false;
		}
		
		var key = {};
		
		if (chunk.length == 3 && chunk.charCodeAt(0) == 27 && chunk.charCodeAt(1) == 91) {
			switch (chunk.charCodeAt(2)) {
				case 65 :
					key.name = 'up';
					break;
				case 66 :
					key.name = 'down';
					break;
				case 67 :
					key.name = 'right';
					break;
				case 68 :
					key.name = 'left';
					break;
			}
		}
		else if (chunk.length == 2 && chunk.charCodeAt(0) == 13 && chunk.charCodeAt(1) == 0) {
			key.name = 'return';
		}
		else if (chunk.length == 1 && chunk.charCodeAt(0) == 127 ) {
			key.name = 'backspace';
		}
		else if (chunk == '\t') {
			key.name = 'tab';
		}
		
		next(chunk, key)
	}
	
	var handleData = this.handleData = function(chunk, key) {
		//console.log("[" + chunk.charCodeAt(0) + "] [" + chunk.charCodeAt(1) + "] [" + chunk.charCodeAt(2) + "] [" + chunk.charCodeAt(3) + "] [" + chunk.charCodeAt(4) + "] [" + chunk.charCodeAt(5) + "] [" + chunk.charCodeAt(6) + "] [" + chunk.charCodeAt(7) + "]");
		//console.log(chunk, key);
		
		if (key && key.name == 'return') {
			self.writeln('');
			
			var input = inputBuffer.join('');
			inputBuffer = [];
			
			var tokens = input.split(/\ /gi);
			var command = tokens.shift();
			
			if (command in commands[commands.length -1]) {
				commands[commands.length -1][command].apply(null, tokens);
				commandHistory.push(command);
			}
			else if ("default" in commands[commands.length -1]) {
				commands[commands.length -1]["default"].apply(null, [input]);
				commandHistory.push(command);
			}
			else {
				self.writeln("Unknown Command (" + input + "). Maybe you should try help?");
			}
			
			self.showPrompt();
			
			commandIndex = commandHistory.length;
		}
		else if (key && key.name == 'backspace') {
			var val = inputBuffer.pop()
			
			if (val == "\t") {
				self.write("\x08\x08\x08\x08\x08\x08      \x08\x08\x08\x08\x08\x08");
			}
			else if (val) {
				self.write("\x08 \x08");
			}
		}
		else if (key && key.ctrl && key.name == 'c') {
			process.exit();
		}
		else if (key && arrowKeys[key.name]) {
			if (key.name == 'up') {
				if (commandIndex - 1 >= 0) {
					commandHistory[commandIndex] = inputBuffer.join('');
					
					commandIndex--;
					
					while (inputBuffer.pop()) {
						self.write("\x08 \x08");
					}
					
					var oldCommand = commandHistory[commandIndex] || "";
					inputBuffer = oldCommand.split('');
					
					self.write(inputBuffer.join(''));
				}
			}
			else if (key.name = 'down') {
				if (commandIndex + 1 < commandHistory.length) {
					commandHistory[commandIndex] = inputBuffer.join('');
					
					commandIndex++;
									
					while (inputBuffer.pop()) {
						self.write("\x08 \x08");
					}
					
					var oldCommand = commandHistory[commandIndex] || "";
					inputBuffer = oldCommand.split('');
					
					self.write(inputBuffer.join(''));
				}
			}
		}
		else if (key && key.name == 'tab') {
			//TODO: do autocomplete stuff here
			self.write("      ");
			inputBuffer.push("\t");
		}
		else if (chunk) {
			if (self.echo) {
				self.write(chunk);
			}
			inputBuffer.push(chunk);
		}
	}
	
	this.run = function () {
		//check if input is this processes stdin
		if (input == process.stdin) {
			keypress(input);
			input.setRawMode(true);
			input.resume();
			input.on('keypress', handleData);
		}
		else {
			//this must be a network stream? //TODO: check for this.
			input.setEncoding('ascii');
			
			//tell the client to not do line mode //TODO: check to see if client is telnet?
			input.write(new Buffer([0xFF,0xFB,0x01,0xFF,0xFB,0x03]));//,0xFF,0xFF,0xFC,0x22]));
			
			//add on data event handler
			input.on('data', function (chunk) {  processKey(chunk, handleData) } );
		}
		
		if (options.welcome) {
			self.write(options.welcome);
		}
		
		self.showPrompt();
	}
	
	this.showCommandHelp = this.showHelp = function() {
		self.writeln('');
		
		map(commands[commands.length -1], function (key, val) {
			if (key !== "default") {
				self.write(key + "\n\r");
			}
		});
	};
	
	this.writeln = function (str) {
		try {
			output.write(str + '\n\r');
		}
		catch (e) {
			
		}
	};
	
	this.write = function (str) {
		try {
			output.write(str);
		}
		catch (e) {
			
		}
	};
	
	this.push = function (prompt, commands) {
		this.prompt.push(prompt);
		this.commands.push(commands);
	};
	
	this.pop = function () {
		this.prompt.pop();
		this.commands.pop();
	};
	
	this.showPrompt = function () {
		self.write(prompt.join(':') + options.promptSuffix);
	};
	
	self.run();
}

