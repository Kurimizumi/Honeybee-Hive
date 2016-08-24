//Import forge
var forge = require('node-forge');
//AES helper
var AES = require('../../Utils/AES.js');
//Error handler
var Error = require('../../Utils/Error.js');
//Setup mongoose
var mongoose = require('mongoose');
//TODO: Allow the user to specify their own database
mongoose.connect('mongodb://localhost/hive');
//Import worker schema in order to register the new worker
var Worker = require('../MongoSchemas/Worker.js');
//Export single function for registration
module.exports = function(message, socket, eventEmitter, key) {
  //Create new worker
  var newWorker = new Worker();
  //Create a keypair
  newWorker.generateRSAKeyPair(function(keyPair) {
    //If an error occured when generating the key, tell the user that an error
    //occured
    if(!keyPair) {
      //Stop on error
      Error.sendError(socket, 'SECURITY_KEY_GENERATION_FAILURE', true);
      //Return to stop further execution
      return;
    }
    //Get the current date
    var date = new Date();
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
        Error.sendError(socket, 'DATABASE_GENERIC', true);
        //Return to stop further execution
        return;
      }
      //Export key and form the message
      var jsonmsg = {
        privateKey: forge.pki.privateKeyToPem(keyPair.privateKey)
      }
      //Generate an IV
      var iv = AES.generateIV();
      //Declare message for try/catch
      var message;
      //Encrypt the message, passing errors to user
      try {
        message = AES.encrypt(key, iv, JSON.stringify(jsonmsg));
      } catch {
        Error.sendError(socket, 'SECURITY_ENCRYPTION_FAILURE', true);
        //Stop execution
        return;
      }
      //Send the message and the user's new ID
      socket.sendMessage({'id': newWorker._id, 'payload': message[0], 'tag': message[1], 'iv': message[2]}, function(error) {
        //Destroy the socket (make the user reconnect and verify etc)
        socket.destroy();
      });
    });
  });
}
