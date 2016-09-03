'use strict';
//Import mongoose, the display manager
const mongoose = require('mongoose');
//Import forge library for key generation
const forge = require('node-forge');
//Create a worker schema for storing clients
const workerSchema = mongoose.Schema({
  //For verification
  publicKey: String,
  //Get registration date (future functionality)
  registered: Date,
  //Get last active date (future functionality)
  lastActive: Date
});

//Key generation method
workerSchema.methods.generateRSAKeyPair = function(callback) { 
  // object properties can be added to const variables
  forge.pki.rsa.generateKeyPair({bits: 2048, workers: -1},
    function(error, keypair) {
    if(error == null) {
      return callback(keypair);
    } else {
      return callback(null);
    }
  });
};

//Export the schema for use
module.exports = mongoose.model('Worker', workerSchema);
