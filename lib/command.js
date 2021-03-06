var consts = require('./consts');
var util = require('./util');
var cliff = require('cliff');
var fs = require('fs');

var Command = function() {
	this.commands = {};
	this.init();
	this.Context = 'all';
}

module.exports = function(){
	return new Command();
}

Command.prototype.init = function() {
	var self = this;
	fs.readdirSync(__dirname + '/commands').forEach(function(filename) {
		if (/\.js$/.test(filename)) {
			var name = filename.substr(0, filename.lastIndexOf('.'));
			var _command = require('./commands/' + name);
			self.commands[name] = _command;
		}
	});
}

Command.prototype.handle = function(argv, msg, rl, client){
  function trimArray(stringArray) {
    return stringArray.map(function(string) {return string.trim()})
  }

  if (!rl) {
    var fragments = trimArray(argv.split(':'))
    var context = argv.indexOf(':') > -1 ? fragments[0] : 'all'

    argv = fragments.slice(argv.indexOf(':') > -1).join(' ')
    this.setContext(context)

    var mkMsg = function(reachScope, proced, cmd) {
      return "run app.get('"+ reachScope +"')." + proced + "('" + cmd + "')"
    }

    var aliases = {
      announceGlobal: function(cmd) {return mkMsg('broadcastMessage', 'sendAnnouncement', cmd)},
      announcePermanentGlobal: function(cmd) {return mkMsg('broadcastMessage', 'sendPermanentAnnouncement', cmd)},
      disconnectGlobal: function(cmd) {return mkMsg('broadcastMessage', 'sendDisconnect', cmd)},
      announce: function(cmd) {return mkMsg('serverCustomMessageDispatcher', 'sendAnnouncement', cmd)},
      announcePermanent: function(cmd) {return mkMsg('serverCustomMessageDispatcher', 'sendPermanentAnnouncement', cmd)},
      disconnect: function(cmd) {return mkMsg('serverCustomMessageDispatcher', 'sendDisconnect', cmd)}
    }

    fragments = trimArray(argv.split(' '))
    if (aliases[fragments[0]]) {
      argv = aliases[fragments[0]](fragments.slice(1).join(' ')).trim()
    }
  }

	var self = this;
  var argvs = argv.split(" ")
	var comd = argvs[0];
	var comd1 = argvs.length > 1 ? argvs.slice(1).join(' ') : ""

	comd1 = comd1.trim();
	var m = this.commands[comd];
	if(m){
		var _command = m();
		_command.handle(self, comd1, argv, rl, client, msg);
	} else {
		util.errorHandle(argv, rl);
	}
}

Command.prototype.quit = function(rl){
	rl.emit('close');
}

Command.prototype.kill = function(rl, client){
	rl.question(consts.KILL_QUESTION_INFO, function(answer){
		if(answer === 'yes'){
			client.request(consts.CONSOLE_MODULE, {
				signal: "kill"
			}, function(err, data) {
				if (err) console.log(err);
				rl.prompt();
			});
		} else {
			rl.prompt();
		}
	});
}

Command.prototype.getContext = function(){
	return this.Context;
}

Command.prototype.setContext = function(context){
	this.Context = context;
}
