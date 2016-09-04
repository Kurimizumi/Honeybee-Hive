'use strict';
//GENERIC IMPORTS
//Import deep-defaults, the default settings module
const defaults = require('deep-defaults');

//HIVE IMPORTS
//Import net for JsonSocket
const net = require('net');
//Import JsonSocket
const JsonSocket = require('json-socket');
//Import ws for JsonWebSocket
const ws = require('nodejs-websocket');
//Import JsonWebSocket
const JsonWebSocket = require('json-websocket');
//Hive connection handler
const hiveConnectionHandler = require('./Hive/Server/ConnectionHandler.js');
//Import the Hive event handler
const HiveEventHandler = require('./Hive/Server/EventHandler.js');
//Import the WorkerCleaner
const workerCleaner = require('./Hive/WorkerUtils/WorkerCleaner.js');
//Create the Hive prototype, for the server
const hive = function(userSettings) {
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
  const eventHandler = new HiveEventHandler();
  //Create a TCP server
  const server = net.createServer();
  //Listen on the port defined above
  server.listen(settings.connection.port);
  //Start the WorkerCleaner
  workerCleaner(mongoose, settings);
  //When we receive a connection, create a socket
  server.on('connection', function(socket) {
    //Wrap the socket in the JsonSocket
    socket = new JsonSocket(socket);
    //Pass in the information we need.
    hiveConnectionHandler(socket, mongoose, eventHandler, settings);
  });
  //If the websocket was desired, enable the server
  if(settings.websocket.enabled === true) {
    //Create a ws server
    const server = ws.createServer();
    //Listen on the port defined above
    server.listen(settings.websocket.port);
    //When we receive a connection, create a socket
    server.on('connection', function(socket) {
      //Wrap the socket in a JsonWebSocket
      socket = new JsonWebSocket(socket);
      //Pass in the socket
      hiveConnectionHandler(socket, mongoose, eventHandler, settings);
    });
    //Listen for stop events
    eventHandler.on('stop', function(callback) {
      //Stop the ws server gracefully. Callback is called once the server has
      //finished all current connections.
      server.close();
    });
  }
  //Listen for stop events
  eventHandler.on('stop', function(callback) {
    //Stop the TCP server gracefully. Callback is called once the server has
    //finished all current connections
    server.close(function(error) {
      callback(error);
    });
  });
  //Return the event emitter in order for the client to listen on it
  return eventHandler;
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
const honeybee = function(userSettings, callback) {
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
module.exports.Hive = hive;
module.exports.Honeybee = honeybee;
