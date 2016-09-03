'use strict';
//Import forge
const forge = require('node-forge');
//AES helper
const AES = require('simple-encryption').AES;
//Error handler
const errorHandler = require('../../Utils/errorHandler.js');
//Import worker schema in order to register the new worker
const Worker = require('../MongoSchemas/Worker.js');
//Export single function for registration
module.exports = function(message, mongoose, socket, eventEmitter, key) {
  //Create new worker
  const newWorker = new Worker();
  //Create a keypair
  newWorker.generateRSAKeyPair(function(keyPair) {
    //If an error occured when generating the key, tell the user that an error
    //occured
    if(keyPair == null) {
      //Stop on error
      errorHandler.sendError(socket, 'SECURITY_KEY_GENERATION_FAILURE', true);
      //Return to stop further execution
      return;
    }
    //Get the current date
    const date = new Date();
    //Export the public key
    newWorker.publicKey = forge.pki.publicKeyToPem(keyPair.publicKey);
    //Set the last active date to the current date
    newWorker.lastActive = date;
    //Set the registered date to the current date
    newWorker.registered = date;
    //Save the user
    newWorker.save(function(error) {
      //If saving throws an error, tell the user what the error was
      if(error) {
        //Error and disconnect from user
        errorHandler.sendError(socket, 'DATABASE_GENERIC', true);
        //Return to stop further execution
        return;
      }
      //Export key and form the message
      let jsonmsg = {
        privateKey: forge.pki.privateKeyToPem(keyPair.privateKey)
      };
      //Generate an IV
      const iv = AES.generateIV();
      //Declare message for try/catch
      let message;
      //Encrypt the message, passing errors to user
      try {
        message = AES.encrypt(key, iv, JSON.stringify(jsonmsg));
      } catch(e) {
        errorHandler.sendError(socket, 'SECURITY_ENCRYPTION_FAILURE', true);
        //Stop execution
        return;
      }
      //Send the message and the user's new ID
      try {
        socket.sendMessage({'id': newWorker._id, 'payload': message.encrypted,
          'tag': message.tag, 'iv': iv}, function(error) {
          //Destroy the socket (make the user reconnect and verify etc)
          socket.destroy();
        });
      } catch(e) {
        //Destroy socket
        socket.destroy();
        return;
      }
    });
  });
};
