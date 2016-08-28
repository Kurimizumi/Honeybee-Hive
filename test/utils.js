var expect = require("chai").expect;
var RSA = require("../Utils/RSA.js");
var AES = require("../Utils/AES.js");
var forge = require("node-forge");
var Error = require("../Utils/Error.js");
var privateKey = "-----BEGIN RSA PRIVATE KEY-----\r\n\
MIIEowIBAAKCAQEA8O9RtFl/fzWr3YgVk0JqYyrWYe5v03NMgxsBpK3VStl0chc7\r\n\
BAdAm4nNT2JoRbL4Q3EvODsYOGzqwr3iphHDXATkMyWiKX1fh9yl+qZB2cz0O7he\r\n\
SIEYOt4fbdebPn5G2xU1gZuluBVHHK+czEmlZOv/5iV2JyXt4v++4wKIW+cja2bm\r\n\
8x6bI+e5PRMXYpGw7JCqReuK2fUhswzM8modIoE+tA2YBcaCuYtZ2Ak+DhxzBkHf\r\n\
dmTc/RPHDN2a8JZ8PUC7BgAzCiHUOYM0gFQr+qXr0CbHuSyyDbTRALTPG+qqyWDR\r\n\
bhRhiCHHLx4lxD2tclnpX4U+dSo60didkOT8EwIDAQABAoIBAHe5FEqgJoDZ9Lsy\r\n\
gjYYzLDWeo1TZHIYWy7S3rAsSU7WW8zNyl+oEuy3PzRxXAs2cbNhrOsuQkzXoph+\r\n\
rv+C2CcDrznTO4+OY0gp1riEoThPZhW++erha17lPYzhlJ0rNp5rHZl39JNSz3Fr\r\n\
umixN+S8eP6uItY1PM6N8xbvDT9M1zA+bIkT87tgt+AV5U3TwiEsqyZPaGR2Y5I/\r\n\
LIIzEPinlPg6bBDKXxRMV8kEIDRmsNNLllofEGd+yR1YVRpJXUkudfXOIdADPzha\r\n\
Qa3qGxJeHqhrih+r+4Wvr2nfajcKLTFzK+n2maNLwqcleB31w+ZgfQDKOhCIODx3\r\n\
kI2Z24ECgYEA+znB77ZUCRiuk+P49wyqdZZBz8EsaRuCRZ4MPH6PN4fCa7oDarPF\r\n\
doOMz+h5DZp2K4r2Y6j+IfcdWGEjzdfJLkfPZ4Wlr6zd6DGL6dKNRS7SLNge35yN\r\n\
ndqi8yXsMB7Oera00d/vE5mhqpHmx4rmOofPhYpZwcpoGhJ2pXjruzMCgYEA9YN+\r\n\
6aBOpNo+9AGgiayyE4miQX1KP+JF1PR7wVpHYnhbcubNCD0PHq3Mwzc9e30DQ8V3\r\n\
tk5PVQvpcPMPe2qpjmYLiJOUq+j2QwIG91nvBCEsDETw4rGmDNATOczE2NuGZzp2\r\n\
D7VeLHnpUsDXWCjpwhc0GORY+sA3bFFEl7GCu6ECgYAvOBXpll2JMChwB6Nd2/WW\r\n\
EF3iTK6qOs9rgl9OZ4NHrq6uTNIjlhKBSgyHb2yBUAzx9jaFWNgbTjUnzWpLYEmh\r\n\
90FWddpEgLtczyM7GaYP4NMENsLmyKgdiWCjTvdru/6XNgwafnqTNocaZj34N3U6\r\n\
fxhUQ0LHl+GlNN80DtxP3QKBgEWCrF0C+SEtdWNqToSMM4LalejKy0nZC4Jmkd9F\r\n\
ay6S+vlGJUiu2OgLtwySSEL9Ov5mGyWveECQ9c/30StVIJpjg+JwPkiJ1adVHJnN\r\n\
iaF2rtzua/ES8Ptxse/MbPMk/CGf6Ks742TeQ1QdqxqXws8j+KkPha3A3DA7thro\r\n\
tCXhAoGBAKEGI6yKngyeLVSpiKRX+6/x9J9j0VXPucggTI4ca4vbhMTJGGplImET\r\n\
0QkvlVtmfKIfoJ3fbp/aA+dFEcbPRIyY9q/Y/cvhdqGwcAPT9io+EhVbUv8NbvPU\r\n\
RudbC6j3rS7K6hXcWW3Gwqi33hJ0dwfvcGTWTjaQ4V2jsT3u9SFK\r\n\
-----END RSA PRIVATE KEY-----"
var publicKey = "-----BEGIN PUBLIC KEY-----\r\n\
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8O9RtFl/fzWr3YgVk0Jq\r\n\
YyrWYe5v03NMgxsBpK3VStl0chc7BAdAm4nNT2JoRbL4Q3EvODsYOGzqwr3iphHD\r\n\
XATkMyWiKX1fh9yl+qZB2cz0O7heSIEYOt4fbdebPn5G2xU1gZuluBVHHK+czEml\r\n\
ZOv/5iV2JyXt4v++4wKIW+cja2bm8x6bI+e5PRMXYpGw7JCqReuK2fUhswzM8mod\r\n\
IoE+tA2YBcaCuYtZ2Ak+DhxzBkHfdmTc/RPHDN2a8JZ8PUC7BgAzCiHUOYM0gFQr\r\n\
+qXr0CbHuSyyDbTRALTPG+qqyWDRbhRhiCHHLx4lxD2tclnpX4U+dSo60didkOT8\r\n\
EwIDAQAB\r\n\
-----END PUBLIC KEY-----"


describe("Cipher Suites", function() {
  describe("RSA Cipher suite", function() {
    it("encrypts and decrypts text", function() {
      var plaintext = "Hello, Earth! How are you doing? Regards, the martians on Pluto.";
      var encrypted = RSA.encrypt(publicKey, plaintext);
      var decrypted = RSA.decrypt(privateKey, encrypted);
      expect(decrypted).to.equal(plaintext);
    });
    it("signs and verifies text", function() {
      var plaintext = "Hello, Pluto! How are you doing? Regards, the humans on Mercury.";
      var signed = RSA.sign(privateKey, plaintext);
      var verified = RSA.verify(publicKey, signed.signed, signed.md);
      expect(verified).to.equal(true);
    });
  });
  describe("AES Cipher Suite", function() {
    it("generates keys", function() {
      var key = AES.generateKey();
      var key2 = AES.generateKey(16);
      expect(forge.util.decode64(key).length).to.equal(32);
      expect(forge.util.decode64(key2).length).to.equal(16);
    });
    it("generates IVs", function() {
      var iv = AES.generateIV();
      var iv2 = AES.generateIV(24);
      expect(forge.util.decode64(iv).length).to.equal(12);
      expect(forge.util.decode64(iv2).length).to.equal(24);
    });
    it("encrypts plaintext", function() {
      var plaintext = "Hello, Mercury and Pluto! Can we join in? Regards, the venusians on Jupiter.";
      var key = 'otm4pQef8EO4hvbNr3R4bEhT1LJ3bpYTQ8HumBfMufw=';
      var iv = 'qDDap/gqf2zFhxZi';
      var encrypted = AES.encrypt(key, iv, plaintext);
      expect(encrypted).to.deep.equal(['2PrKEtZIEjpuBKS4S32Fv+5LJmx/sRidnemr43DiXcKozZvQXmLU0FrLvpWHdiahwGEwhGiDCdd9tAaf+YZY/fQbpx7kPVZpo9WFfw==', '/z6JSz16wFKeyj0KfkGDww==', 'qDDap/gqf2zFhxZi']);
    });
    it("decrypts ciphertext", function() {
      var encrypted = ['2PaGGcwdQVYrIaajTSTRsaBCY1ln5BmCnK+H8D6jCsrnxJzYD2Lv2wKKnpSTO3Sx2ygwnWGSW8hg+hyCsKJX/KAc5w==', 'VLTbQOrNPxdQB7UV11jxGA==', 'qDDap/gqf2zFhxZi']
      var key = 'otm4pQef8EO4hvbNr3R4bEhT1LJ3bpYTQ8HumBfMufw=';
      var decrypted = AES.decrypt(key, encrypted[2], encrypted[1], encrypted[0]);
      expect(decrypted).to.equal("Hi guys! Want to meet up for a mocha? Regards, the matrix on Earth.");
    });
  });
});
describe("Error handling", function() {
  it("converts error string to error number", function() {
    var validStringToNumber = Error.findError("SECURITY_DECRYPTION_FAILURE");
    var invalidStringToNumber = Error.findError("SOME_RANDOM_ERROR_HERE_WHICH_IS_REALLY_LONG_AND_INVALID");
    expect(validStringToNumber).to.equal(18);
    expect(invalidStringToNumber).to.equal(0);
  });
  it("converts error number to error string", function() {
    var validNumberToString = Error.findError(17);
    var invalidNumberToString = Error.findError(-1);
    expect(validNumberToString).to.equal("SECURITY_ENCRYPTION_FAILURE");
    expect(invalidNumberToString).to.equal("UNKNOWN_ERROR");
  });
  it("returns correct type when it's defined", function() {
    var numberToNumber = Error.findError(16, "number");
    var stringToString = Error.findError("DATABASE_GENERIC", "string");
    expect(numberToNumber).to.equal(16);
    expect(stringToString).to.equal("DATABASE_GENERIC");
  });
});
