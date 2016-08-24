//GENERIC IMPORTS
//Import event emitter in order for people to be able to listen to events fired
//by us
var events = require('events');

//HIVE IMPORTS
//Import net for JsonSocket
var net = require('net');
//Hive connection handler
var HiveConnectionHandler = require('./Hive/Server/ConnectionHandler.js');
//Create the Hive prototype, for the server
//port = listening port
//key = private RSA key
//workTimeout = time to wait for work until client is assumed dead
//connectionTimeout = time to wait on an idle connection
//groupMax = the maximum number of workers in a group
var Hive = function(port, key, workTimeout, connectionTimeout, groupMax) {
  this.key = key;
  this.workTimeout = workTimeout;
  this.connectionTimeout = connectionTimeout;
  this.groupMax = groupMax;
  //Create an instance of the event emitter in order to use it later
  this.eventEmitter = new events.EventEmitter();
  //Get the port from the function arguments
  this.port = port;
  //Create a TCP server
  this.server = net.createServer();
  //Listen on the port defined above
  server.listen(this.port);
  //When we receive a connection, create a socket and pass it to the
  //HiveConnectionHandler
  server.on('connection', function(socket) {
    //Pass in the socket, the event emitter, and the key
    HiveConnectionHandler(socket, this.eventEmitter, this.key, this.workTimeout,
      this.connectionTimeout, this.groupMax);
  });
  //Return the event emitter in order for the client to listen on it
  return this.eventEmitter;
}

//HONEYBEE IMPORTS
//Import Honeybee's ConnectionHandler
var HoneybeeConnectionHandler = require('./Honeybee/ConnectionHandler.js');
//Import Honeybee's EventHandler
var HoneybeeEventHandler = require('./Honeybee/EventHandler.js');
//Create Honeybee prototype, for the client
//address = string hostname of the server
//port = listening port of the server
//key = public RSA key of the server
var Honeybee = function(address, port, serverPublicKey) {
  this.address = address;
  this.port = port;
  this.serverPublicKey = serverPublicKey;
  //Create an instance of eventEmitter in order to be able to use it later
  this.eventHandler = new EventHandler();
  //Call the connection handler
  HoneybeeConnectionHandler(this.address, this.port, this.serverPublicKey, this.eventHandler);
  return this.eventEmitter;
}
