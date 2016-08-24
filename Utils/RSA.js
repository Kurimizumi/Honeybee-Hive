//Import forge
var forge = require('node-forge');

//Define encryption function
module.exports.encrypt = function(publicKey, message) {
  //Convert public key pem to forge's public key
  publicKey = forge.pki.publicKeyFromPem(publicKey);
  //Encrypt the message using the public key
  var encrypted = publicKey.encrypt(message);
  //Return the encrypted message
  return encrypted;
}
//Define decryption function
module.exports.decrypt = function(privateKey, encrypted) {
  //Convert private key pem to forge's private key
  privateKey = forge.pki.privateKeyFromPem(privateKey);
  //Decrypt the message using the private key
  var message = privateKey.decrypt(message);
  //Return the decrypted message
  return message;
}

//Define signing function
module.exports.sign = function(privateKey, message) {
  //Convert private key pem to forge's private key
  privateKey = forge.pki.privateKeyFromPem(privateKey);
  //Create hash for signing
  var md = forge.md.sha1.create();
  //Update hash with data
  md.update(message, 'utf8');
  //Sign the message using the private key
  var signed = privateKey.sign(md);
  //Return the signed message and the hash in string form
  return {'signed': signed, 'md': md.digest().bytes()};
}

//Define verification function
module.exports.verify = function(publicKey, message, hash) {
  //Convert public key pem to forge's public key
  publicKey = forge.pki.publicKeyFromPem(publicKey);
  //Verify message
  return publicKey.verify(hash, message);
}
