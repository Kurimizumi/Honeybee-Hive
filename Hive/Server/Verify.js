'use strict';
//Import encryption functions
const AES = require('simple-encryption').AES;
const RSA = require('simple-encryption').RSA;
//Import error handler
const errorHandler = require('../../Utils/errorHandler.js');
//Import forge
const forge = require('node-forge');

//Mongoose schemas
const Worker = require('../MongoSchemas/Worker.js');

module.exports = function(message, mongoose, socket, eventEmitter, key,
  callback) {
  //Supposed user ID
  const id = message.id;
  //Get encryption information
  const payload = message.payload;
  const iv = message.iv;
  const tag = message.tag;
  //Define encrypted letiable for try/catch
  let decrypted;
  //Catch any errors during decryption
  try {
    decrypted = JSON.parse(AES.decrypt(key, iv, tag, payload));
  } catch(e) {
    //Forward error to user and disconnect
    errorHandler.sendError(socket, 'SECURITY_DECRYPTION_FAILURE', true);
    //Prevent further execution
    return;
  }
  //Check that decryption was successful, if not disconnect user
  if(!decrypted) {
    errorHandler.sendError(socket, 'STAGE_HANDSHAKE_POST_COMPLETE_FAILURE',
      true);
    //stop execution
    return;
  }
  //Signed payload
  const verify = decrypted.verify;
  //hash
  const md = decrypted.md;
  //Make sure that the required letiables were actually sent
  if(!id || !verify || !md) {
    errorHandler.sendError(socket, 'GENERIC_PARAMETERS_MISSING', true);
    //Stop further execution
    return;
  }
  //Find the ID that the user provided
  return Worker.findOne({'_id': id}, function(error, worker) {
    //If error, tell the user and cut the session (something bad has happened)
    if(error) {
      errorHandler.sendError(socket, 'DATABASE_GENERIC', true);
      return;
    }
    //If no worker was found
    if(!worker) {
      errorHandler.sendError(socket, 'DATABASE_NOT_FOUND', true);
      return;
    }
    //Get the public key for the worker
    const publicKey = worker.publicKey;
    //Declare verified letiable for try/catch
    let verified;
    //Verify that the worker is who they say they are. If verification fails
    //pass the error to the user
    try {
      verified = RSA.verify(publicKey, verify, md);
    } catch(e) {
      errorHandler.sendError(socket, 'SECURITY_VERIFICATION_FAILURE', true);
      //Stop execution
      return;
    }
    //Generate IV for encryption
    const newIV = AES.generateIV();
    //Create message for encryption
    let jsonmsg = {
      'verified': verified
    };
    //Declare message letiable for try/catch
    let message;
    //Encrypt message, passing errors to user
    try {
      message = AES.encrypt(key, iv, JSON.stringify(jsonmsg));
    } catch(e) {
      errorHandler.sendError(socket, 'SECURITY_ENCRYPTION_FAILURE', true);
      //Stop execution
      return;
    }
    //Send to the user the status of if they are verified or not
    try {
      socket.sendMessage({'payload': message.encrypted,
        'tag': message.tag, 'iv': iv});
    } catch(e) {
      //Destroy socket
      socket.destroy();
      return;
    }
    //Return to the callback
    return callback(verified);
  });
};
