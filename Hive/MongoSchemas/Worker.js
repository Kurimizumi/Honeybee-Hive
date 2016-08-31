//Import mongoose, the display manager
var mongoose = require('mongoose');
//Import forge library for key generation
var forge = require('node-forge');
//Create a worker schema for storing clients
var workerSchema = mongoose.Schema({
  //For verification
  publicKey: String,
  //Get registration date (future functionality)
  registered: Date,
  //Get last active date (future functionality)
  lastActive: Date
});

//Key generation method
workerSchema.methods.generateRSAKeyPair = function(callback) {
  forge.pki.rsa.generateKeyPair({bits: 2048, workers: -1},
    function(error, keypair) {
    if(!error) {
      return callback(keypair);
    } else {
      return callback(null);
    }
  });
};

//Export the schema for use
module.exports = mongoose.model('Worker', workerSchema);
