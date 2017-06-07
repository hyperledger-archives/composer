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

const Concerto = require('..');

require('chai').should();

describe('Concerto', () => {

    it('should export all types required by Go', () => {
        Concerto.Container.should.be.a('function');
        Concerto.Context.should.be.a('function');
        Concerto.DataCollection.should.be.a('function');
        Concerto.DataService.should.be.a('function');
        Concerto.Engine.should.be.a('function');
        Concerto.EventService.should.be.a('function');
        Concerto.HTTPService.should.be.a('function');
        Concerto.IdentityService.should.be.a('function');
        Concerto.LoggingService.should.be.a('function');
    });

});
