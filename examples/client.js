//Calculate pi using the Leibniz formula
//Import the index file (usually honeybee-hive)
var HoneybeeHive = require('../index.js');
//Import the fs module in order to import the key
var fs = require('fs');
//Define various settings
const PORT = 54321;
const ADDRESS = 'localhost';

//Import key from filesystem
var key = fs.readFileSync('public.pem', 'utf8');

//Define eventHandler in order to assign it later
var eventHandler;

//Define our submission handler, to handle what happens once we submit work
var submitHandler = function(success) {
  //Tell the client the status of our submission
  console.log('Submission ' + (success ? 'succeeded' : 'failed'));
  //Request more work, and pass it to the work handler
  eventHandler.request(workHandler);
}
//Define our work handler, to handle what happens when we receive work
var workHandler = function(work) {
  //Define our piSection variable, to store the part of pi we calculated
  var piSection = 0;
  //Define n for Leibniz's formula, and calculate current position in it
  var n = 1 + (4*10000*work.counter);
  //Loop from 0 (incl) to 1000000000 (excl)
  for(var i=0; i < 10000; i++) {
    //Do the current pair of the series
    piSection += (4/n)-(4/(n+2));
    //Add 4 to n
    n += 4;
  }
  //Log the piSection we just calculated to the console
  console.log("Calculated PiSection: " + piSection);
  //Submit the work and callback to the submitHandler
  eventHandler.submit(piSection, submitHandler);
}

//Create the client, connecting to the server at ADDRESS:PORT using its public key
HoneybeeHive.Honeybee(ADDRESS, PORT, key, function(evtHandler) {
  //Set eventHandler to the eventHandler
  eventHandler = evtHandler;
  //Callback once we know the client is registered and ready
  eventHandler.once('registered', function() {
    //Request our first piece of work
    eventHandler.request(workHandler);
  });
});
