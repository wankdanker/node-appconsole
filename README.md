node-appconsole
---------------

A generic application console for node.

The goal of this project is to provide an easy way to define a text based
console with auto-complete, command history, menu contexts, auto-help, 
auto-menu and other nice features.

I lost interest in it some time ago. But here it is...

api
---

###AppConsole(options)

Create an instance of AppConsole. `options` is an object with the possible
following properties:

* welcome - A welcome message to display upon start
* promptSuffix - What is displayed at the end of the current prompt (default: "> ")
* input - the input stream to read from (default: process.stdin)
* output - the output stream to write to (default: process.stdout)
* prompt - the default current prompt (default : "")
* commands - an object of commands where the keys are the command names

###.showCommandHelp()

###.writeln(str)

###.write(str)

###.push(prompt, commands)

###.pop()

###.showPrompt()
