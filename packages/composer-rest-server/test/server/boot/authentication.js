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

const authentication = require('../../../server/boot/authentication');

require('chai').should();
const sinon = require('sinon');

describe('authentication boot script', () => {

    let composerConfig;
    let app;

    beforeEach(() => {
        composerConfig = null;
        app = {
            get: (name) => {
                if (name !== 'composer') {
                    return null;
                }
                return composerConfig;
            },
            enableAuth: sinon.stub()
        };
    });

    it('should do nothing if composer not set', () => {
        authentication(app);
    });

    it('should do nothing if composer authentication is not enabled', () => {
        composerConfig = {
            authentication: false
        };
        authentication(app);
        sinon.assert.notCalled(app.enableAuth);
    });

    it('should enable authentication if composer authentication is enabled', () => {
        composerConfig = {
            authentication: true
        };
        authentication(app);
        sinon.assert.calledOnce(app.enableAuth);
    });

});
