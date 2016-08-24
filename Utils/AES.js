//Import forge
var forge = require('node-forge');

//Define encryption function
module.exports.encrypt = function(key, iv, message) {
  //Create the cipher variable for forge
  var cipher = forge.cipher.createCipher('AES-GCM', decrypted.key);
  //Start cipher
  cipher.start({'iv': iv});
  //Update cipher with plaintext handshake
  cipher.update(forge.util.createBuffer(message));
  //Tell the cipher that we are finished
  cipher.finish();
  //Get the ciphertext
  var encrypted = cipher.output;
  //Get the authentication tag
  var tag = cipher.mode.tag;
  //Return data to caller
  return [encrypted, tag, iv];
}

//Define decryption function
module.exports.decrypt = function(key, iv, tag, encrypted) {
  //Create the decipher variable for forge
  var decipher = forge.cipher.createDecipher('AES-GCM', key);
  //Start decipher
  decipher.start({
    'iv': iv,
    'tag': tag
  });
  //Update the decipher with the encrypted text
  decipher.update(encrypted);
  //Get decrypted text, or false if authentication failed
  var message = decipher.finish();
  //Return decrypted message or false to the caller
  return message;
}

//Define IV generation function
module.exports.generateIV = function(bytes) {
  //Default to 12 bytes for AES-GCM's IV
  bytes = bytes || 12;
  //Generate and return bytes
  return forge.random.getBytesSync(bytes);
}

module.exports.generateKey = function(bytes) {
  //Default to 32 bytes for 256 bit AES
  bytes = bytes || 32;
  //Generate and return random bytes
  return forge.random.getBytesSync(bytes);
}
