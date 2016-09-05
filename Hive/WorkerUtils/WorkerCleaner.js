'use strict';
//Require Worker and WorkGroup
const Worker = require('../MongoSchemas/Worker.js');
const WorkGroup = require('../MongoSchemas/WorkGroup');
//Require errorList
const errorList = require('../../error/errorList.js');
//Export main function
module.exports = function(mongoose, settings) {
  //If workTimeout is less than or equal to 0, do not use a timeout
  if(settings.timeouts.workTimeout <= 0) {
    return;
  }
  //Every workTimeout milliseconds, call the function
  setInterval(function() {
    //Find all workers who were last active more than or equal to workTimeout
    //seconds ago
    Worker.find({
      lastActive: {
        $lte: new Date() - settings.timeouts.workTimeout
      }
    },function(error, workers) {
      //If the database returned an error
      if(error) {
        //Log to the console the error and then return to prevent further
        //execution
        console.log(
          new errorList.DatabaseGeneric('search workers failed').toString()
        );
        //Return to prevent further exection
        return;
      }
      //Define functions for use within loops
      //Function for database errors in order to tell the user
      const saveWorkGroup = function(error) {
        //If error, tell the user
        if(error) {
          console.log(
            new errorList.DatabaseGeneric('save workgroup failed').toString()
          );
        }
      };
      //Define i for later
      let i = 0;
      //Function for searching workgroups
      const searchWorkGroup = function(error, workgroups) {
        //Check for errors, if so don't continue
        if(error) {
          //Log to the console
          console.log(
            new errorList.DatabaseGeneric('search workgroup failed').toString()
          );
          return;
        }
        //Loop through the workgroups, removing the worker
        for(let j = 0; j < workgroups.length; j++) {
          //Remove the worker from the workgroup
          workgroups[j].workers.splice(
            workgroups[j].workers.indexOf(workers[i]), 1
          );
          workgroups[j].save(saveWorkGroup);
        }
      };
      //Loop through all the workers
      for(i = 0; i < workers.length; i++) {
        //Find workgroups which the worker hasn't submitted data for
        WorkGroup.find({
          //All conditions should be true
          $and: [
            //And in the workers section of the work group
            {'workers': workers[i]._id},
            //Only workgroups which the worker has not submitted data for
            {
              //In the data array
              data: {
                //Not equal to elemMatch (i.e, workgroups where data hasn't been
                //submitted)
                $not: {
                  //Match all documents with the the entry worker in the object
                  //array equal to the worker ID
                  $elemMatch: {
                    worker: workers[i]._id
                  }
                }
              }
            }
          ]
        }, searchWorkGroup);
      }
    });
  }, settings.timeouts.checkInterval);
};
