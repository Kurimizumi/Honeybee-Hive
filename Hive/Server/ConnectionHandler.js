//Import JsonSocket for easier JSON parsing with net
var JsonSocket = require('json-socket');
//Import specific message functions
var register = require('./Register.js');
var handshake = require('./Handshake.js');
var verify = require('./Verify.js');
var request = require('./Request.js');
var submit = require('./Submit.js');

//Mongoose
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/hive');
//Import error handling function
var Error = require('../../Utils/Error.js');
//Export the message handling function
//Socket is the socket passed by index, eventEmitter is the Event
//Listener/Emitter, workTimeout is the amount of time to wait before assuming
//that the client will not respond to their work request, and connectionTimeout
//is the time allowed for inactivity before the TCP socket is closed
module.exports = function(socket, eventEmitter, key, workTimeout,
  connectionTimeout, groupMax) {
  //Wrap the socket with JsonSocket
  socket = new JsonSocket(socket);
  //Set an inactivity timeout of 30 seconds in order to prevent DOS attacks
  socket.setTimeout(connectionTimeout, function() {
    //Destroy the socket to prevent communications either way
    socket.destroy();
  });
  //Define aesKey, verified, and id so they persist between messages
  var aesKey, verified, id;
  //Listen for a message from the client. message is a javascript object
  socket.on('message', function(message) {
    //If the required parameters do not exist
    if(!message ||
      !message.type
    ) {
      //Send a message to the client to let them know why it failed
      Error.sendError(socket, 'GENERIC_PARAMETERS_MISSING', true);
      //Return to prevent further execution
      return;
    }
    //If the message is to initiate a handshake to get an AES key (c->s);
    if(message.type.toUpperCase() == 'HANDSHAKE') {
      //Call the handshake with the message, socket, eventEmitter and the
      //private RSA key
      aesKey = handshake(message, socket, eventEmitter, key);
      //Return to prevent further execution until next message
      return;
    }
    //If a handshake has not taken place, do not continue
    if(!aesKey) {
      return;
    }
    //If the message doesn't look encrypted, do not continue
    if(!message.payload ||
      !message.tag ||
      !message.iv
    ) {
      //Send an error to the client, but don't disconnect them
      Error.sendError(socket, 'GENERIC_MISSING_SECURITY_INFORMATION');
      //Stop execution
      return;
    }
    //If the message is to register
    if(message.type.toUpperCase() == 'REGISTER') {
      //Call register function with the message, socket, eventEmitter and the
      //session key
      register(message, mongoose, socket, eventEmitter, aesKey);
      //Return to prevent further execution until the next message
      return;
    }
    //If not verified
    else if(message.type.toUpperCase() == 'VERIFY') {
      //Call verify function with message, socket, eventEmitter, session key,
      //and a callback due to mongodb being asynchronous
      verify(message, mongoose, socket, eventEmitter, aesKey, function(verif) {
        verified = verif;
        if(verified) {
          id = message.id;
        }
      });
      //Return to prevent further execution until the next message
      return;
    }
    //Past this point the user should have their user ID verified and attached
    //to the session.
    if(!verified) {
      //If the user has not verified who they are, do not continue
      Error.sendError(socket, 'STAGE_VERIFICATION_NOT_EXECUTED');
      //Stop running
      return;
    }

    //Main block of VERIFIED USER code
    //DONE: Request new work (check if the user has current work - if so check
    //      that the user wants to cancel it). Creates/adds to a WorkGroup
    //      Mongoose query for finding incomplete work groups (arrays less than
    //      the desired length):
    //      {['Worker Array.' + maxNumber]: {$exists: false}}
    if(message.type.toUpperCase() == 'REQUEST') {
      request(message, mongoose, socket, eventEmitter, aesKey, id, groupMax);
    }
    //TODO: Submit work for verification. Should check if the WorkGroup has
    //      matching results
    else if(message.type.toUpperCase() == 'SUBMIT') {
      submit(message, mongoose, socket, eventEmitter, aesKey, id, groupMax);
    }
    //TODO: That's it???
  });
}
