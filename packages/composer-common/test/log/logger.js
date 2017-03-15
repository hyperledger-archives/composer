/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const Logger = require('../../lib/log/logger');
const Tree = require('../../lib/log//tree.js');

const chai = require('chai');
// const should = chai.should();
chai.use(require('chai-things'));
// const sinon = require('sinon');

describe('Logger', () => {

    describe('#getLog', () => {

        it('Log should be returned', () => {

            Logger._envDebug='composer:*';

            let mm = Logger.getLog('Test');
            mm.should.not.be.null;
        });

    });

    describe('#info', () => {
        it('Call a trace point', () => {

            Logger._envDebug='composer:*';

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
        it('Call a trace point trace not enabled', () => {

            // Logger._envDebug='composer:*';

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
            Logger._envDebug='composer:*';

            // let mm = Logger.getLog('Test');
            Logger.setFunctionalLogger({
                log: function(){
                    console.log('{\"composer\":'+JSON.stringify(arguments)+'}');
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
            Logger._envDebug='composer:bill';

            let mm = Logger.getLog('Test');
            mm.should.not.be.null;

            mm.info('Method','Message','Data');
        });
    });

    describe('#info', () => {
        it('Call a trace point matching specific', () => {
            console.log('reseting root');
            Logger.reset();
            Logger._envDebug='composer:bill';

            let mm = Logger.getLog('bill');
            mm.should.not.be.null;

            mm.info('Method','Message','Data');

        });
    });

    describe('#tree tests', () => {
        it('Run data into the tree object', () => {

            let _tree = new Tree();
            _tree.setRootInclusion();
            _tree.addNode('alpha',false);


            _tree.getInclusion('alpha').should.be.false;
            _tree.getInclusion('omega').should.be.true;
            _tree.addNode('alpha/beta',true);
            _tree.getInclusion('alpha/beta').should.be.true;

            _tree.addNode('alpha/beta',true);
            _tree.getInclusion('alpha/beta').should.be.true;

            _tree.addNode('gamma/delta/epsilon',false);
            _tree.getInclusion('gamma/delta/epsilon').should.be.false;
            _tree.getInclusion('gamma/delta').should.be.true;
            _tree.getInclusion('gamma').should.be.true;
        });

    }

  );

});
