//Import forge
var forge = require('node-forge');

//Define encryption function
module.exports.encrypt = function(key, iv, message) {
  //Create the cipher variable for forge
  var cipher = forge.cipher.createCipher('AES-GCM', forge.util.decode64(key));
  //Start cipher
  cipher.start({'iv': forge.util.decode64(iv)});
  //Update cipher with plaintext handshake
  cipher.update(forge.util.createBuffer(message));
  //Tell the cipher that we are finished
  cipher.finish();
  //Get the ciphertext
  var encrypted = forge.util.encode64(cipher.output.data.toString());
  //Get the authentication tag
  var tag = forge.util.encode64(cipher.mode.tag.data.toString());
  //Return data to caller
  return [encrypted, tag, iv];
}

//Define decryption function
module.exports.decrypt = function(key, iv, tag, encrypted) {
  //Create the decipher variable for forge
  var decipher = forge.cipher.createDecipher('AES-GCM',
    forge.util.decode64(key));
  //Start decipher
  decipher.start({
    'iv': forge.util.decode64(iv),
    'tag': forge.util.decode64(tag)
  });
  //Update the decipher with the encrypted text
  decipher.update(forge.util.createBuffer(forge.util.decode64(encrypted)));
  //Get decrypted text, or false if authentication failed
  var message = decipher.finish() ? decipher.output.data.toString() : false;
  //Return decrypted message or false to the caller
  return message;
}

//Define IV generation function
module.exports.generateIV = function(bytes) {
  //Default to 12 bytes for AES-GCM's IV
  bytes = bytes || 12;
  //Generate and return bytes
  return forge.util.encode64(forge.random.getBytesSync(bytes));
}

module.exports.generateKey = function(bytes) {
  //Default to 32 bytes for 256 bit AES
  bytes = bytes || 32;
  //Generate and return random bytes
  return forge.util.encode64(forge.random.getBytesSync(bytes));
}
