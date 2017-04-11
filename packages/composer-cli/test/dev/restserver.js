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


const restserver = require('../../lib/cmds/dev/restserver.js');

// const rest = require('../../lib/cmds/dev/lib/rest.js');

//require('../lib/deploy.js');
require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
require('sinon-as-promised');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));


describe('composer dev restserver unit tests', function () {

    let sandbox;


    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        // sandbox.stub(restserver, 'startRestServer');
        // sandbox.stub(rest, 'restserver');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('no option specified', function () {
        let argv = {};
        restserver.handler(argv);
      //  sinon.assert.calledOnce(restserver.restserver.startRestServer);
            // return restserver.handler(argv)
            // .then ((result) => {
            //     sinon.assert.calledOnce(composerrestserver.startRestServer);
            //
            // });
    });

});
