/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const Logger = require('../../lib/log/logger');


const chai = require('chai');
// const should = chai.should();
chai.use(require('chai-things'));
// const sinon = require('sinon');

describe('Logger', () => {

    describe('#getLog', () => {

        it('Log should be returned', () => {

            Logger._envDebug='concerto:*';

            let mm = Logger.getLog('Test');
            mm.should.not.be.null;
        });

    });

    describe('#info', () => {
        it('Call a trace point', () => {

            Logger._envDebug='concerto:*';

            let mm = Logger.getLog('Test');
            mm.should.not.be.null;

            mm.info('Method','Message','Data');
            mm.debug('Method','Message','Data');
            mm.warn('Method','Message','Data');
            mm.error('Method','Message','Data');
            mm.verbose('Method','Message','Data');
          //  mm.silly('Method','Message','Data');

            mm.entry('Method','data');
            mm.exit('Method','data');

            mm.verbose('Method');

            mm.verbose('Method','Error',new Error('test error'));
        });
    });

    describe('#infoOff', () => {
        it('Call a trace point tracenot enabled', () => {

            // Logger._envDebug='concerto:*';

            let mm = Logger.getLog('Test');
            mm.should.not.be.null;

            mm.info('Method','Message','Data');
            mm.debug('Method','Message','Data');
            mm.warn('Method','Message','Data');
            mm.error('Method','Message','Data');
            mm.verbose('Method','Message','Data');
          //  mm.silly('Method','Message','Data');

            mm.entry('Method','data');
            mm.exit('Method','data');

            mm.verbose('Method');

            mm.verbose('Method','Error',new Error('test error'));
        });
    });

    describe('#setFunctionalLogger', () => {
        it('Call a trace point', () => {
            Logger._envDebug='concerto:*';

            // let mm = Logger.getLog('Test');
            Logger.setFunctionalLogger({
                log: function(){
                    console.log('{\"concerto\":'+JSON.stringify(arguments)+'}');
                }
            });
            // mm.should.not.be.null;
            //
            Logger.setFunctionalLogger(null);
        });


    });

    describe('#info', () => {
        it('Call a trace point specific on string', () => {
            console.log('reseting root');
            Logger.reset();
            Logger._envDebug='concerto:bill';

            let mm = Logger.getLog('Test');
            mm.should.not.be.null;

            mm.info('Method','Message','Data');
        });
    });

    describe('#info', () => {
        it('Call a trace point matching specific', () => {
            console.log('reseting root');
            Logger.reset();
            Logger._envDebug='concerto:bill';

            let mm = Logger.getLog('bill');
            mm.should.not.be.null;

            mm.info('Method','Message','Data');

        });
    });

});
