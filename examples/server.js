//Calculate pi using the Leibniz formula
//Import the index file (usually honeybee-hive)
var HoneybeeHive = require('../index.js');
//Import the fs module in order to import the key
var fs = require('fs');
//Define various setting constants
const PORT = 54321; //Listening port
const WORK_TIMEOUT = 60000; //Timeout until a client is assumed to not be completing the work
const SESSION_TIMEOUT = 30000; //Timeout until a client is assumed to not be responding on the current session
const GROUP_MAX = 2; //Amount of clients required to submit data for the work to be classed as completed
const FINISH_COUNT = 100; //Amount of jobs to schedule
//Define counter for amount of work pieces created
var workCounter = 0;
//Define counter for how many times work has been verified
var completeCounter = 0;

//Read the PEM encoded private key from the file system
var serverPrivateKey = fs.readFileSync('private.pem', 'utf8');
//Define pi variable to store pi for later
var pi = 0;

//Define server settings
var settings = {
  connection: {
    port: 54321
  },
  encryption: {
    key: serverPrivateKey
  },
  timeouts: {
    workTimeout: WORK_TIMEOUT,
    sessionTimeout: SESSION_TIMEOUT,
  },
  work: {
    groupMax: GROUP_MAX
  }
}
//Start the server
var eventEmitter = HoneybeeHive.Hive(settings);
//Tell the user that the server has been started
console.log('Server started');
//Listen for create work events
eventEmitter.on('create_work', function(callback) {
  //If we have 100 jobs submitted
  if(workCounter >= FINISH_COUNT) {
    //Tell the callback that there's no more work
    callback(false);
  } else {
    //Tell the callback the work that we wish to create
    //In this case, we just supply the counter
    //We put it in a javascript object in order to prevent 0 being fed into it
    //and it thinking we have no work
    callback(
      {
        counter: workCounter
      }
    );
  }
  //Increment the work counter
  workCounter++;
});

//Listen for workgroup complete events
eventEmitter.on('workgroup_complete', function(array, callback) {
  //We loop through the array, and check if all of the data sets are equal.
  //You can do your own validation here e.g. have a majority consensus or verify
  //the output of each one yourself, looking for valid data (useful for things
  //similar to cryptocurrency mining)
  for(var i = 0; i < array.length - 1; i++) {
    //We now have the individual work submitted by the clients
    //If the current value is not equal
    if(array[i] !== array[i+1]) {
      //Call the callback with a false javascript value (e.g. false, undefined, etc)
      callback(false);
      //Return to prevent further execution
      return;
    }
  }
  //Call the callback with the first value, since it equals all other values
  callback(array[0]);
});

//Listen for datachunk formation events
eventEmitter.on('new_datachunk', function(datachunk) {
  //Add datachunk to pi
  pi += datachunk;
  //Log the current value of pi to the console
  console.log("Current pi value: " + pi);
});




/*
var Pi=0;
var n=1;
for (i=0;i<=1000000000000;i++)
{
Pi=Pi+(4/n)-(4/(n+2))
n=n+4
}
console.log(Pi);
*/
