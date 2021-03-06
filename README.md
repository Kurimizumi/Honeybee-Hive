# Deprecation notice
This module is no longer updated. Take a look at Flarp's [Distri-Node](https://github.com/Flarp/Distri-Node) instead.

# Honeybee-Hive
Master [![CircleCI][circleci-image]][circleci-link]
Dev [![CircleCI][circleci-dev-image]][circleci-dev-link]

[![NPM Version][version-image]][npm-link]
[![NPM Download][download-image]][npm-link]

[![Gitter][gitter-image]][gitter-link]

A node module to allow for volunteer computing, like BOINC.

## Install
```bash
npm install honeybee-hive --save
```

## Notes
* Alpha stages, expect breaking changes between versions currently
* If you want to have clients from the browser, take a look at [Honeybee-Web](https://github.com/Kurimizumi/Honeybee-Web)

## Example setups
###Server
* Inline: Work is processed and created inside of your node application
* Subprocess: Work is created and processed inside of another application (can be in another language), and information is passed between the node app and your child process
* Database (not recommended): Work is created and processed by another application, but it is added to a database. The node app finds work in the database and removes it, giving it to the client

###Client
* Inline: Work is processed inside of the application, and then handed back to the server
* Subprocess: Work is transferred to and from the server by the node application, but processed by a subprocess which is a different application
* Database (not recommended): Work is added to a database, and another client periodically checks the database for new work, and then adds processed work back to the database

## Usage
See [examples](https://github.com/Kurimizumi/Honeybee-Hive/tree/master/examples) for working examples, which might be easier to understand

### Server
#### Start function
The server gets called like this:
```javascript
let HoneybeeHive = require('honeybee-hive');
let eventHandler = HoneybeeHive.Hive(settings);
```

The settings object is described below

#### Settings
```javascript
let settings = {
  connection: {
    port: 54321 //Listening port, defaults to 54321
  },
  //All in milliseconds
  timeouts: {
    workTimeout: 60000, //Time to wait until a client is assumed to be dead and not completing the work set, allowing someone else to do so. Set to a value less than 1 to disable. Default: 60000
    sessionTimeout: 30000, //Time to wait until a TCP socket which is idle is assumed to be dead and therefore destroyed. Default: 30000
    checkTimeout: 10000, //How often to check for work timeouts. Default: 10000
  },
  work: {
    groupMax: 10 //How many datasets must be submitted before the workgroup is considered completed. Default: 10
  },
  proofOfWork: {
    strength: 4 //How difficult should the proof of work problem be? Higher values help to prevent spam, but take longer to calculate on average. Set to -1 to be (essentially) off. Default: 4
  },
  encryption: {
    key: "some private key" //NO DEFAULT. YOU MUST SET THIS. The PEM encoded RSA private key for the server
  },
  sections: {
    disableRegistration: false //Disables registration if this value is true. Default: false
  },
  database: {
    hostname: 'localhost', //Sets the hostname for the mongodb database. Default: localhost
    port: '27017', //Optional. Sets the port for the mongodb databse. Default: none
    databaseName: 'hive' //The name for the mongodb database. You could set this to your project name. Default: hive
  },
  websocket: {
    enabled: false, //Sets if we should also run a WebSocket server for WebSocket clients using Honeybee-Web. Default: false
    port: 54322 //What  port we should run the WebSocket server on. Default: 54322
  }
}
```

#### Event Emitter
The main function returns an event emitter which we can then listen on, like this:
```javascript
eventHandler.on('eventName', function(eventArgs, eventArgs2) {
  //Some code here to process event arguments
});
```
The events are detailed below

###### Create work
We can listen for requests to create work like this:
```javascript
eventHandler.on('create_work', function(callback) {
  //We can send the work to the callback like this:
  callback({
    work: 0
  });
  //Or if there's no work remaining, we can send the callback a null value in JavaScript, like this
  callback(null);
});
```

###### Workgroup complete
When a set of work is complete, we must verify it. We can do so like this:
```javascript
eventHandler.on('workgroup_complete', function(array, callback) {
  //Make sure that all the values of the array are equal
  for(let i = 0; i < array.length - 1; i++) {
    //If they aren't equal
    if(array[i] !== array[i+1]) {
      //Then return null to the callback
      callback(null);
    }
  }
  //Otherwise, we can return the first element, since we just want to make sure that there's a consensus
  //You could also return an average, or work backwards on the solution
  callback(array[0]);
});
```


###### Datachunk creation
When a workgroup is validated, we can then bring it together with other validated workgroups, or datachunks, like this:
```javascript
let total = 0;
eventHandler.on('new_datachunk', function(datachunk) {
  //datachunk is the data that we submitted to the callback for workgroup_complete
  //We access the count property and add it to the total, and then log it to the console
  total += datachunk.count;
  console.log(total);
});
```
Remember that if order matters, then you'll need to submit an order with the work, and form a queue type system

###### Stopping the server
To stop the server you can do this:
```javascript
eventHandler.stop(function() {
  //Called once all existing connections have finished and the server is actually closed.
});
```


###### Notes

* Progress is not saved. It's advisable that when you create work that you somehow store the work that has been created and what hasn't. Once work is created, it will be distributed to clients, but otherwise there is no way for you to know what work needs to be created still.

### Client
#### Start function
The client gets called like this:
```javascript
let HoneybeeHive = require('honeybee-hive');
HoneybeeHive.Honeybee(settings, function(eventHandler) {
  //Wait for us to be registered
  eventHandler.once('registered', function() {
    //Request our first piece of work
    eventHandler.request(workHandler);
  })
});
```

The settings object is described below

#### Settings
```javascript
let settings = {
  connection: {
    hostname: 'localhost', //The hostname the server is listening on, defaults to localhost
    port: 54321 //Listening port, defaults to 54321
  },
  encryption: {
    key: "some public key" //NO DEFAULT. YOU MUST SET THIS. The PEM encoded RSA public key for the server
  }
}
```

#### Event Handler
The main function returns an event handler which we can then call, like this:
```javascript
eventHandler.functionName(callback);
```
The callbacks and events are detailed below

###### Ready
We know that the client is ready to process work when the registered event is fired. We can listen to this by doing:
```javascript
eventHandler.once('registered', function() {
  //Request work here
});
```

###### Request work
We can request work like this:
```javascript
eventHandler.request(function(error, work) {
  //If error is true, then we can process it as needed
  //work is the work that we specified on the server
  //we should process it and then send it for submission
});
```

###### Submit work
We can submit processed work like this:
```javascript
eventHandler.submit(work, function(error, success) {
  //If error is true then we can process it as needed
  //success tells us if the submission was successful. You should not retry on failure, rather just request new work
});
```

* work is the processed work that we wish to submit to the server

###### Combining the two
We can combine requesting and submitting like this:
```javascript
function workHandler(error, work) {
  eventHandler.submit(work, submitHandler);
}
function submitHandler(error, success) {
  eventHandler.request(workHandler);
}
//Request first work
eventHandler.request(workHandler);
```

#### Error handling
As you can see in the above examples, there are areas where an error object is returned.

You can do something similar to a try/catch block in Java with if statements, importing the error objects. E.g.:
```javascript
const HoneybeeHive = require('honeybee-hive');
const errorList = HoneybeeHive.errorList;
const errorGroups = HoneybeeHive.errorGroups;
function workHandler(error, work) {
  if(error) {
    //Start try/catch-esque if/else if/else block
    //Catch all security errors
    if(error instanceof errorGroups.SecurityError) {
      //Do something here
    }
    //Catch only post handshake errors
    else if(error instanceof errorList.HandshakePostCompleteFailure) {
      //Do something
    }
    //Catch all *other* handshake errors
    else if(error instanceof errorGroups.HandshakeError) {
      //Do something
    }
    //Catch either submit or request errors
    else if(error instanceof errorGroups.SubmitError || error instanceof errorGroups.RequestError) {
      //Do something
    }
    //Catch all other errors, including generic/unknown errors
    else {
      //Do something
    }
  }
}
```

This is the complete list of errors, their description, and their error group:

| Error Name                        | Error Group       | Error Description                                                                                                        |
|-----------------------------------|-------------------|--------------------------------------------------------------------------------------------------------------------------|
| DatabaseGeneric                   | DatabaseError     | Generic database errors which do not have a specific error associated                                                    |
| DatabaseNotFound                  | DatabaseError     | When a record was not found in the database (e.g. when the worker was not found as being a worker for the submitted data |
| GenericPayloadMissing             | GenericError      | When the encrypted payload is missing                                                                                    |
| GenericParametersMissing          | GenericError      | When parameters are missing (e.g. the type of message)                                                                   |
| GenericSecurityInformationMissing | GenericError      | When security information is missing (e.g. the IV used to encrypt the payload)                                           |
| HandshakeGeneric                  | HandshakeError    | When a generic handshake error occurs                                                                                    |
| HandshakeKeyMissing               | HandshakeError    | When the client doesn't provide an AES key                                                                               |
| HandshakePostCompleteFailure      | HandshakeError    | When the handshake fails elsewhere (e.g. someone edits the packets and fails to match the authentication tag)            |
| VerificationGeneric               | VerificationError | When a generic verification error occurs                                                                                 |
| VerificationNotExecuted           | VerificationError | When a user tries to execute an operation which requires verification, but they have not verified themselves yet         |
| RequestNoWork                     | RequestError      | When a user tries to request work, but there is none remaining for the server to give out                                |
| RequestPendingWork                | RequestError      | When a user tries to request work, but has work which is unsubmitted                                                     |
| SubmitNoData                      | SubmitError       | When a user sends no completed work with the submission                                                                  |
| SecurityInvalidKey                | SecurityError     | When an invalid key format is sent                                                                                       |
| SecurityKeyGenerationFailure      | SecurityError     | When an RSA keypair fails to generate                                                                                    |
| SecurityEncryptionFailure         | SecurityError     | When there's an error encrypting                                                                                         |
| SecurityDecryptionFailure         | SecurityError     | When there's an error decrypting                                                                                         |
| SecuritySigningFailure            | SecurityError     | When there's an error signing the message                                                                                |
| SecurityVerificationFailure       | SecurityError     | When there's an error when trying to verify a message                                                                    |



###### Notes

* Progress is not saved. It's advisable that when you receive work that you save it for processing later, and also record the time of the request in order to avoid DATABASE_NOT_FOUND errors on the client

## License
[ISC][license-link]

[license-link]: https://github.com/Kurimizumi/Honeybee-Hive/blob/master/LICENSE.md
[gitter-image]: https://img.shields.io/gitter/room/Kurimizumi/Honeybee-Hive.svg
[gitter-link]: https://gitter.im/Honeybee-Hive/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge
[circleci-image]: https://circleci.com/gh/Kurimizumi/Honeybee-Hive/tree/master.svg?&style=shield
[circleci-link]: https://circleci.com/gh/Kurimizumi/Honeybee-Hive/tree/master
[circleci-dev-image]: https://circleci.com/gh/Kurimizumi/Honeybee-Hive/tree/dev.svg?style=shield
[circleci-dev-link]: https://circleci.com/gh/Kurimizumi/Honeybee-Hive/tree/dev
[npm-link]: https://npmjs.org/package/honeybee-hive
[version-image]: https://img.shields.io/npm/v/honeybee-hive.svg
[download-image]: https://img.shields.io/npm/dm/honeybee-hive.svg
