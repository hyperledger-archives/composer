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

const DataService = require('composer-runtime').DataService;
const EmbeddedDataService = require('..').EmbeddedDataService;

require('chai').should();

describe('EmbeddedDataService', () => {

    let dataService;

    beforeEach(() => {
        dataService = new EmbeddedDataService('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
    });

    afterEach(() => {
        return dataService.destroy();
    });

    describe('#constructor', () => {

        it('should create a data service with a UUID', () => {
            dataService = new EmbeddedDataService('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
            dataService.should.be.an.instanceOf(DataService);
        });

        it('should create a data service without a UUID', () => {
            dataService = new EmbeddedDataService();
            dataService.should.be.an.instanceOf(DataService);
        });

    });

});
