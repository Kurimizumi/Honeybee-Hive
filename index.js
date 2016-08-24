//Import event emitter in order for people to be able to listen to events fired
//by us
var events = require("events");
//Import net for JsonSocket
var net = require("net");
//Hive connection handler
var HiveConnectionHandler = require("./Hive/Server/ConnectionHandler.js");
//Create the Hive prototype, for the server
var Hive = function(port, key, workTimeout, connectionTimeout, groupMax) {
  //Store the private key in a variable for handshakes
  this.key = key;
  //Store the workTimeout to use later
  this.workTimeout = workTimeout;
  //Store the connectionTimeout to use later
  this.connectionTimeout = connectionTimeout;
  //Store the groupMax to use later
  this.groupMax = groupMax;
  //Create an instance of the event emitter in order to use it later
  this.eventEmitter = new events.EventEmitter();
  //Get the port from the function arguments, or default to port 10987
  this.port = port || 10987;
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
