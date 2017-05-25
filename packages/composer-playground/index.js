'use strict';
const winston = require('winston');

process.on('uncaughtException', function (err) {
    console.log( 'Uncaught Exception: ' + err.stack);
});

winston.loggers.add('application', {
    console: {
        level: 'silly',
        colorize: true,
        label: 'Composer-GettingStarted'
    }
});

const LOG = winston.loggers.get('application');

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

//let config = require('config').get('gettingstarted');
const mqlight = require('mqlight');

// these are the credentials to use to connect to the Hyperledger Fabric
//let participantId = config.get('participantId');
//let participantPwd = config.get('participantPwd');
let participantId = 'admin';
let participantPwd = 'adminpw';


let bizNetworkConnection = new BusinessNetworkConnection();
//let CONNECTION_PROFILE_NAME = config.get('connectionProfile');
let CONNECTION_PROFILE_NAME = 'MQ-v1';
// let businessNetworkIdentifier = config.get('businessNetworkIdentifier');
let businessNetworkIdentifier = 'org.acme.biznet';
let businessNetworkDefinition;
let sendClient;

return bizNetworkConnection.connect(CONNECTION_PROFILE_NAME, businessNetworkIdentifier, participantId, participantPwd)
.then((result) => {
  businessNetworkDefinition = result;
  LOG.info('MQ-Composer:<init>', 'businessNetworkDefinition obtained', businessNetworkDefinition.getIdentifier());
})
.then (  () => {

  sendClient = mqlight.createClient({service: 'amqp://127.0.0.1'});
  sendClient.on('started', ()=> {
      LOG.info('MQ-Composer:<init>','MQlight started');
  });


  bizNetworkConnection.on('event',(evt)=>{
    LOG.info('MQ-Composer:onEvent','Event from Composer has arrived');

    let options = {
      properties: { key:'value'}
    };

    let text = evt.getIdentifier();

    LOG.info('MQ-Composer:onEvent','Sending ' +text);
    sendClient.send('digitalproperty-network/sale', text, options,function (err, topic,data,options) {
            LOG.info('MQ-Composer:onEvent','Topic: '+ topic);
            LOG.info('MQ-Composer:onEvent','Data:'+ data);
            LOG.info('MQ-Composer:onEvent','Options:' + JSON.stringify(options));
           LOG.info('MQ-Composer:onEvent','Error ' + err);

          });

  });

})
// and catch any exceptions that are triggered
.catch(function (error) {
  throw error;
});
