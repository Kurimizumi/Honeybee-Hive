'use strict';
//GENERIC IMPORTS
//Import event emitter in order for people to be able to listen to events fired
//by us
const events = require('events');

//Import deep-defaults, the default settings module
const defaults = require('deep-defaults');

//HIVE IMPORTS
//Import net for JsonSocket
const net = require('net');
//Hive connection handler
const hiveConnectionHandler = require('./Hive/Server/ConnectionHandler.js');
//Import the WorkerCleaner
const workerCleaner = require('./Hive/WorkerUtils/WorkerCleaner.js');
//Create the Hive prototype, for the server
const Hive = function(userSettings) {
  //Set default settings
  const settings = defaults(userSettings,
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
    },
    sections: {
      disableRegistration: false
    },
    database: {
      hostname: 'localhost',
      databaseName: 'hive'
    },
    websocket: {
      enabled: false,
      port: 54322
    }
  });
  //Mongoose
  const mongoose = require('mongoose');
  mongoose.Promise = global.Promise;
  mongoose.connect('mongodb://' + settings.database.hostname +
    (settings.database.port ? ':' + settings.database.port : '') +
    '/' + settings.database.databaseName);
  //Create an instance of the event emitter in order to use it later
  const eventEmitter = new events.EventEmitter();
  //Create a TCP server
  const server = net.createServer();
  //Listen on the port defined above
  server.listen(settings.connection.port);
  //Start the WorkerCleaner
  workerCleaner(mongoose, settings);
  //When we receive a connection, create a socket and pass it to the
  //HiveConnectionHandler - normal TCP socket
  server.on('connection', function(socket) {
    //Pass in the socket, the settings
    hiveConnectionHandler(socket, mongoose, eventEmitter, settings);
  });
  //Return the event emitter in order for the client to listen on it
  return eventEmitter;
};

//HONEYBEE IMPORTS
//Import Honeybee's ConnectionHandler
const honeybeeConnectionHandler = require('./Honeybee/ConnectionHandler.js');
//Import Honeybee's EventHandler
const HoneybeeEventHandler = require('./Honeybee/EventHandler.js');
//Create Honeybee prototype, for the client
//address = string hostname of the server
//port = listening port of the server
//key = public RSA key of the server
const Honeybee = function(userSettings, callback) {
  //Set default settings
  const settings = defaults(userSettings, {
    connection: {
      hostname: 'localhost',
      port: 54321
    }
  });
  //Create an instance of eventEmitter in order to be able to use it later
  const eventHandler = new HoneybeeEventHandler();
  //Pass the eventHandler back to the client
  callback(eventHandler);
  //Call the connection handler
  honeybeeConnectionHandler(eventHandler, settings);
};

//Export functions
module.exports.Hive = Hive;
module.exports.Honeybee = Honeybee;
