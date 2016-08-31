//GENERIC IMPORTS
//Import event emitter in order for people to be able to listen to events fired
//by us
var events = require('events');

//Import deep-defaults, the default settings module
var defaults = require('deep-defaults');

//HIVE IMPORTS
//Import net for JsonSocket
var net = require('net');
//Hive connection handler
var hiveConnectionHandler = require('./Hive/Server/ConnectionHandler.js');
//Import the WorkerCleaner
var workerCleaner = require('./Hive/WorkerUtils/WorkerCleaner.js');
//Create the Hive prototype, for the server
//port = listening port
//key = private RSA key
//workTimeout = time to wait for work until client is assumed dead
//connectionTimeout = time to wait on an idle connection
//groupMax = the maximum number of workers in a group
//checkTimeout = how often workers are checked for being inactive
var Hive = function(settings) {
  //Mongoose
  this.mongoose = require('mongoose');
  this.mongoose.Promise = global.Promise;
  this.mongoose.connect('mongodb://localhost/hive');
  //Set default settings
  this.settings = defaults(settings,
  {
    connection: {
      port: 54321
    },
    timeouts: {
      workTimeout: 60000,
      connectionTimeout: 30000,
      checkTimeout: 10000
    },
    work: {
      groupMax: 10
    }
  });
  //Set settings to individual variables
  this.port = this.settings.connection.port;
  this.key = this.settings.encryption.key;
  this.workTimeout = this.settings.timeouts.workTimeout;
  this.connectionTimeout = this.settings.timeouts.connectionTimeout;
  this.checkTimeout = this.settings.timeouts.checkTimeout;
  this.groupMax = this.settings.work.groupMax;
  //Create an instance of the event emitter in order to use it later
  this.eventEmitter = new events.EventEmitter();
  //Create a TCP server
  this.server = net.createServer();
  //Listen on the port defined above
  this.server.listen(this.port);
  //Start the WorkerCleaner
  workerCleaner(this.mongoose, this.workTimeout, this.checkTimeout);
  //When we receive a connection, create a socket and pass it to the
  //HiveConnectionHandler
  this.server.on('connection', function(socket) {
    //Pass in the socket, the event emitter, and the key
    hiveConnectionHandler(socket, this.eventEmitter, this.mongoose, this.key,
      this.connectionTimeout, this.groupMax);
  }.bind(this));
  //Return the event emitter in order for the client to listen on it
  return this.eventEmitter;
};

//HONEYBEE IMPORTS
//Import Honeybee's ConnectionHandler
var honeybeeConnectionHandler = require('./Honeybee/ConnectionHandler.js');
//Import Honeybee's EventHandler
var HoneybeeEventHandler = require('./Honeybee/EventHandler.js');
//Create Honeybee prototype, for the client
//address = string hostname of the server
//port = listening port of the server
//key = public RSA key of the server
var Honeybee = function(settings, callback) {
  //Set default settings
  this.settings = defaults(settings, {
    connection: {
      hostname: 'localhost',
      port: 54321
    }
  });
  //Set settings to indivial variables
  this.hostname = this.settings.connection.hostname;
  this.port = this.settings.connection.port;
  this.key = this.settings.encryption.key;
  //Create an instance of eventEmitter in order to be able to use it later
  this.eventHandler = new HoneybeeEventHandler();
  //Pass the eventHandler back to the client
  callback(this.eventHandler);
  //Call the connection handler
  honeybeeConnectionHandler(this.hostname, this.port, this.key,
    this.eventHandler);
};

//Export functions
module.exports.Hive = Hive;
module.exports.Honeybee = Honeybee;
