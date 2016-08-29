//Require Worker and WorkGroup
var Worker = require('../MongoSchemas/Worker.js');
var WorkGroup = require('../MongoSchemas/WorkGroup');
//Export main function
module.exports = function(mongoose, workTimeout, checkInterval) {
  //If workTimeout is less than or equal to 0, do not use a timeout
  if(workTimeout <= 0) {
    return;
  }
  //Every workTimeout milliseconds, call the function
  setInterval(function() {
    //Find all workers who were last active more than or equal to workTimeout seconds ago
    Worker.find({
      lastActive: {
        $lte: new Date() - workTimeout
      }
    },function(error, workers) {
      //If the database returned an error
      if(error) {
        //Log to the console the error and then return to prevent further execution
        console.log('Error: DATABASE_GENERIC');
        //Return to prevent further exection
        return;
      }
      //Loop through all the workers
      for(var i = 0; i < workers.length; i++) {
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
                //Not equal to elemMatch (i.e, workgroups where data hasn't been submitted)
                $not: {
                  //Match all documents with the the entry worker in the object array equal to the worker ID
                  $elemMatch: {
                    worker: workers[i]._id
                  }
                }
              }
            }
          ]
        }, function(error, workgroups) {
          //Check for errors, if so don't continue
          if(error) {
            //Log to the console
            console.log('Error: DATABASE_GENERIC');
            return;
          }
          //Loop through the workgroups, removing the worker
          for(var j = 0; j < workgroups.length; j++) {
            //Remove the worker from the workgroup
            workgroups[i].workers.splice(workgroups[i].workers.indexOf(workers[i]), 1);
            workgroups[i].save(function(error) {
              //If error, tell the user
              if(error) {
                console.log('Error: DATABASE_GENERIC');
              }
            });
          }
        });
      }
    });
  }, checkInterval);
}
