'use strict';

const Table = require('cli-table');
const prettyoutput = require('prettyoutput');
var config = require('config').get('<%= appName %>');


// Require the client API
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

// these are the credentials to use to connect to the Hyperledger Fabric
let participantId = config.get('participantId');
let participantPwd = config.get('participantPwd');
// physial connection details (eg port numbers) are held in a profile
let connectionProfile = config.get('connectionProfile');

// the logical business newtork has an indentifier
let businessNetworkIdentifier = config.get('businessNetworkIdentifier');
// ... which allows us to get a connection to this business network
let businessNetworkConnection = new BusinessNetworkConnection();
// the network definition will be used later to create assets
let businessNetworkDefinition;

let assetRegistry;

// create the connection
businessNetworkConnection.connectWithDetails(connectionProfile, businessNetworkIdentifier, participantId, participantPwd)
  .then((result) => {
      businessNetworkDefinition = result;
      console.log('Connected: BusinessNetworkDefinition obtained=' + businessNetworkDefinition.getIdentifier());
      return businessNetworkConnection.getAllAssetRegistries();
  }).then((result) => {
      console.log('List of asset registries=');

      let table = new Table({
          head: ['Registry Type', 'ID', 'Name']
      });
      for (let i=0; i<result.length; i++){
          let tableLine = [];

          tableLine.push(result[i].registryType);
          tableLine.push(result[i].id);
          tableLine.push(result[i].name);
          table.push(tableLine);
      }

      console.log(table.toString());
      return businessNetworkConnection.disconnect();
  }).
  then(() => {
      console.log('All done');
      process.exit();
  })// and catch any exceptions that are triggered
  .catch(function (error) {
      throw error;
  });
