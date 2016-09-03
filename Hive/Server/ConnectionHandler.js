'use strict';
//Import JsonSocket for easier JSON parsing with net
const JsonSocket = require('json-socket');
//Import specific message functions
const register = require('./Register.js');
const handshake = require('./Handshake.js');
const verify = require('./Verify.js');
const request = require('./Request.js');
const submit = require('./Submit.js');


//Import error handling function
const errorHandler = require('../../Utils/errorHandler.js');
//Export the message handling function
//mongoose is the mongoose instance which has been configured to the database,
//Socket is the socket passed by index, eventEmitter is the Event
//Listener/Emitter, and settings contains user settings
module.exports = function(socket, mongoose, eventEmitter, settings) {
  //Wrap the socket with JsonSocket
  socket = new JsonSocket(socket);
  //Set an inactivity timeout of 30 seconds in order to prevent DOS attacks
  socket.setTimeout(settings.timeouts.connectionTimeout, function() {
    //Destroy the socket to prevent communications either way
    socket.destroy();
  });
  //Define aesKey, verified, and id so they persist between messages
  let aesKey, verified, id;
  //Listen for a message from the client. message is a javascript object
  socket.on('message', function(message) {
    //If the required parameters do not exist
    if(message == null || message.type == null) {
      //Send a message to the client to let them know why it failed
      errorHandler.sendError(socket, 'GENERIC_PARAMETERS_MISSING', true);
      //Return to prevent further execution
      return;
    }
    //If the message is to initiate a handshake to get an AES key (c->s)
    if(message.type.toUpperCase() === 'HANDSHAKE') {
      //Call the handshake with the message, socket, eventEmitter and the
      //private RSA key
      aesKey = handshake(message, socket, eventEmitter,
        settings.encryption.key);
      //Return to prevent further execution until next message
      return;
    }
    //If a handshake has not taken place, do not continue
    if(aesKey == null) {
      return;
    }
    //If the message doesn't look encrypted, do not continue
    if(message.payload == null ||
      message.tag == null ||
      message.iv == null
    ) {
      //Send an error to the client, but don't disconnect them
      errorHandler.sendError(socket, 'GENERIC_MISSING_SECURITY_INFORMATION');
      //Stop execution
      return;
    }
    //If the message is to register
    if(message.type.toUpperCase() === 'REGISTER' &&
      !settings.sections.disableRegistration
    ) {
      //Call register function with the message, socket, eventEmitter and the
      //session key
      register(message, mongoose, socket, eventEmitter, aesKey);
      //Return to prevent further execution until the next message
      return;
    }
    //If not verified
    else if(message.type.toUpperCase() === 'VERIFY') {
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
    if(verified == null) {
      //If the user has not verified who they are, do not continue
      errorHandler.sendError(socket, 'STAGE_VERIFICATION_NOT_EXECUTED');
      //Stop running
      return;
    }

    //Main block of VERIFIED USER code
    //DONE: Request new work (check if the user has current work - if so check
    //      that the user wants to cancel it). Creates/adds to a WorkGroup
    //      Mongoose query for finding incomplete work groups (arrays less than
    //      the desired length):
    //      {['Worker Array.' + maxNumber]: {$exists: false}}
    if(message.type.toUpperCase() === 'REQUEST') {
      request(message, mongoose, socket, eventEmitter, aesKey, id,
        settings.work.groupMax);
    }
    //TODO: Submit work for verification. Should check if the WorkGroup has
    //      matching results
    else if(message.type.toUpperCase() === 'SUBMIT') {
      submit(message, mongoose, socket, eventEmitter, aesKey, id,
        settings.work.groupMax);
    }
    //TODO: That's it???
  });
};
