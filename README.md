# Honeybee-Hive
[![CircleCI][circleci-image]][circleci-link]
[![NPM Version][version-image]][npm-link]
[![NPM Download][download-image]][npm-link]

A node module to allow for volunteer computing, like BOINC.

## Install
```bash
npm install honeybee-hive --save
```

## Notes
* Alpha stages, expect breaking changes between versions currently

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
var HoneybeeHive = require('honeybee-hive');
var eventEmitter = HoneybeeHive.Hive(settings);
```

The settings object is described below

#### Settings
```javascript
var settings = {
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
  encryption: {
    key: "some private key" //NO DEFAULT. YOU MUST SET THIS. The PEM encoded RSA private key for the server
  }
}
```

#### Event Emitter
The main function returns an event emitter which we can then listen on, like this:
```javascript
eventEmitter.on('eventName', function(eventArgs, eventArgs2) {
  //Some code here to process event arguments
});
```
The events are detailed below

###### Create work
We can listen for requests to create work like this:
```javascript
eventEmitter.on('create_work', function(callback) {
  //We can send the work to the callback like this:
  callback({
    work: 0
  });
  //Or if there's no work remaining, we can send the callback a false value in JavaScript, like this
  callback(false);
  //Or like this
  callback(0);
  //Or this
  callback(undefined);
});
```
Because 0 is regarded as false in JavaScript, you should wrap numbers and booleans in a JavaScript object or array

###### Workgroup complete
When a set of work is complete, we must verify it. We can do so like this:
```javascript
eventEmitter.on('workgroup_complete', function(array, callback) {
  //Make sure that all the values of the array are equal
  for(var i = 0; i < array.length - 1; i++) {
    //If they aren't equal
    if(array[i] !== array[i+1]) {
      //Then return false to the callback
      callback(false);
    }
  }
  //Otherwise, we can return the first element, since we just want to make sure that there's a consensus
  //You could also return an average, or work backwards on the solution
  callback(array[0]);
});
```

Again, we need to take into account that 0 is a false value in javascript, so you should wrap it in a JavaScript object if you need to use it

###### Datachunk creation
When a workgroup is validated, we can then bring it together with other validated workgroups, or datachunks, like this:
```javascript
var total = 0;
eventEmitter.on('new_datachunk', function(datachunk) {
  //datachunk is the data that we submitted to the callback for workgroup_complete
  //We access the count property and add it to the total, and then log it to the console
  total += datachunk.count;
  console.log(total);
});
```

Remember that if order matters, then you'll need to submit an order with the work, and form a queue type system

###### Notes

* Progress is not saved. It's advisable that when you create work that you somehow store the work that has been created and what hasn't. Once work is created, it will be distributed to clients, but otherwise there is no way for you to know what work needs to be created still.

### Client
#### Start function
The client gets called like this:
```javascript
var HoneybeeHive = require('honeybee-hive');
var eventHandler;
HoneybeeHive.Honeybee(settings, function(evtHandler) {
  //Set eventHandler to evtHandler
  eventHandler = evtHandler;
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
var settings = {
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
eventHandler.request(function(work) {
  //work is the work that we specified on the server
  //we should process it and then send it for submission
});
```

###### Submit work
We can submit processed work like this:
```javascript
eventHandler.submit(work, function(success) {
  //success tells us if the submission was successful. You should not retry on failure, rather just request new work
});
```

* work is the processed work that we wish to submit to the server

###### Combining the two
We can combine requesting and submitting like this:
```javascript
function workHandler(work) {
  eventHandler.submit(work, submitHandler);
}
function submitHandler(success) {
  eventHandler.request(workHandler);
}
//Request first work
eventHandler.request(workHandler);
```


###### Notes

* Progress is not saved. It's advisable that when you receive work that you save it for processing later, and also record the time of the request in order to avoid DATABASE_NOT_FOUND errors on the client

## License
[ISC][license-link]

[license-link]: https://github.com/Kurimizumi/Honeybee-Hive/blob/master/LICENSE.md
[circleci-image]: https://circleci.com/gh/Kurimizumi/Honeybee-Hive.svg?&style=shield
[circleci-link]: https://circleci.com/gh/Kurimizumi/Honeybee-Hive
[npm-link]: https://npmjs.org/package/honeybee-hive
[version-image]: https://img.shields.io/npm/v/honeybee-hive.svg
[download-image]: https://img.shields.io/npm/dm/honeybee-hive.svg
