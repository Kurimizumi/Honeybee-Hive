//Require net for JsonSocket
var net = require('net');
//Require json-socket
var JsonSocket = require('json-socket');
//Require node-persist
var storage = require('node-persist');

//Sections
var register = require('./Register.js');
var request = require('./Request.js');
var submit = require('./Submit.js');

var main = function(address, port, serverPublicKey, eventHandler,
  clientPrivateKey, clientID) {
  //Register for alerts
  eventHandler.on('request', function(callback) {
    //Create socket
    var socket = new JsonSocket(new net.Socket());
    //Connect to server
    socket.connect(port, address);
    //Wait until we are connected
    socket.on('connect', function() {
      request(socket, eventHandler, serverPublicKey,
        clientPrivateKey, clientID, callback);
    });
  });
  eventHandler.on('submit', function(data, callback) {
    //Create socket
    var socket = new JsonSocket(new net.Socket());
    //Connect to server
    socket.connect(port, address);
    //Wait until we are connected
    socket.on('connect', function() {
      submit(socket, eventHandler, serverPublicKey,
        clientPrivateKey, clientID, data, callback);
    });
  });
  //Alert client that we have registered and are ready for work
  eventHandler.registered();
};
//Export the main function
module.exports = function(address, port, serverPublicKey, eventHandler) {
  //Load the storage
  storage.initSync();
  //Load private key
  var clientPrivateKey = storage.getItem('key');
  //If not registered
  if(clientPrivateKey == null) {
    //Create socket
    var socket = new JsonSocket(new net.Socket());
    //Connect to server
    socket.connect(port, address);
    //Wait for connection
    socket.on('connect', function() {
      //Call register function
      register(socket, eventHandler, storage, serverPublicKey,
        function(clientPrivateKey, clientID) {
        //Once finished, get the private key and clientID call the main function
        main(address, port, serverPublicKey, eventHandler, clientPrivateKey,
          clientID);
      });
    });
    //Stop execution (main is called once connected)
    return;
  }
  var clientID = storage.getItem('id');
  main(address, port, serverPublicKey, eventHandler, clientPrivateKey,
    clientID);
};
