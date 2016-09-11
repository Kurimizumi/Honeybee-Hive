'use strict';
//Import encryption functions
const AES = require('simple-encryption').AES;
const RSA = require('simple-encryption').RSA;
//Import error handler
const errorHandler = require('../../error/errorHandler.js');
const errorList = require('../../error/errorList.js');
//Import forge
const forge = require('node-forge');

//Mongoose schemas
const Worker = require('../MongoSchemas/Worker.js');

//Import hashcash
const hashcashgen = require('hashcashgen');

module.exports = function(message, mongoose, socket, eventEmitter, key,
  challenge, strength, callback) {
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
    errorHandler.sendError(socket,
      new errorList.SecurityDecryptionFailure(),
      true);
    //Prevent further execution
    return;
  }
  //Check that decryption was successful, if not disconnect user
  if(!decrypted) {
    errorHandler.sendError(socket,
      new errorList.HandshakePostCompleteFailure(),
      true);
    //stop execution
    return;
  }
  //Signed payload
  const verify = decrypted.verify;
  //hash
  const md = decrypted.md;
  //hashcash
  const hashcash = decrypted.hashcash;
  //Make sure that the required variables were actually sent
  if(!id || !verify || !md || !hashcash) {
    errorHandler.sendError(socket,
      new errorList.GenericParametersMissing(),
      true);
    //Stop further execution
    return;
  }
  //Check the hashcash against the challenge
  if(!hashcashgen.check(challenge, strength, hashcash)) {
    //Proof of work failed. Halt.
    errorHandler.sendError(socket,
      new errorList.HandshakeProofOfWorkFailure(),
      true
    );
    return;
  }
  //Find the ID that the user provided
  return Worker.findOne({'_id': id}, function(error, worker) {
    //If error, tell the user and cut the session (something bad has happened)
    if(error) {
      errorHandler.sendError(socket,
        new errorList.DatabaseGeneric(),
        true);
      return;
    }
    //If no worker was found
    if(!worker) {
      errorHandler.sendError(socket,
        new errorList.DatabaseNotFound(),
        true);
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
      errorHandler.sendError(socket,
        new errorList.SecurityVerificationFailure(),
        true);
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
      errorHandler.sendError(socket,
        new errorList.SecurityEncryptionFailure(),
        true);
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
