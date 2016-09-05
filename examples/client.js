'use strict';
//Calculate pi using the Leibniz formula
//Import the index file (usually honeybee-hive)
const honeybeeHive = require('../index.js');
//Import the fs module in order to import the key
const fs = require('fs');
//Define letious settings
const PORT = 54321;
const ADDRESS = 'localhost';

//Import key from filesystem
const key = fs.readFileSync('public.pem', 'utf8');

//Define settings object
const settings = {
  connection: {
    hostname: 'localhost',
    port: 54321
  },
  encryption: {
    key: key
  }
};


//Create the client, connecting to the server with settings object
honeybeeHive.Honeybee(settings, function(eventHandler) {
  //Define our submission handler, to handle what happens once we submit work
  const submitHandler = function(success) {
    //Tell the client the status of our submission
    console.log('Submission ' + (success ? 'succeeded' : 'failed'));
    //Request more work, and pass it to the work handler
    eventHandler.request(workHandler);
  };
  //Define our work handler, to handle what happens when we receive work
  const workHandler = function(work) {
    //Define our piSection letiable, to store the part of pi we calculated
    let piSection = 0;
    //Define n for Leibniz's formula, and calculate current position in it
    let n = 1 + (4*10000*work.counter);
    //Loop from 0 (incl) to 1000000000 (excl)
    for(let i=0; i < 10000; i++) {
      //Do the current pair of the series
      piSection += (4/n)-(4/(n+2));
      //Add 4 to n
      n += 4;
    }
    //Log the piSection we just calculated to the console
    console.log('Calculated PiSection: ' + piSection);
    //Submit the work and callback to the submitHandler
    eventHandler.submit(piSection, submitHandler);
  };
  //Callback once we know the client is registered and ready
  eventHandler.once('registered', function() {
    //Request our first piece of work
    eventHandler.request(workHandler);
  });
});
