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

require('chai').should();
const ModelManager = require('../../lib/modelmanager');
const Factory = require('../../lib/factory');
const Serializer = require('../../lib/serializer');
const fs = require('fs');

describe('Vehicle-Lifecycle Model', function() {
    describe('#model validation', function() {
        it('check create complex resource and roundtrip to JSON', function() {
            let modelManager = new ModelManager();
            modelManager.should.not.be.null;

            // parse a model file from disk and add to the ModelManager
            const files = [
                './test/data/model/vehicle-lifecycle/composer.base.cto',
                './test/data/model/vehicle-lifecycle/composer.business.cto',
                './test/data/model/vehicle-lifecycle/org.acme.vehicle.lifecycle.cto',
                './test/data/model/vehicle-lifecycle/org.acme.vehicle.lifecycle.manufacturer.cto',
                './test/data/model/vehicle-lifecycle/org.gov.uk.dvla.cto',
            ];

            const models = [];

            for(let n=0; n < files.length; n++) {
                models.push(fs.readFileSync(files[n], 'utf8'));
            }

            modelManager.addModelFiles(models, files);

            const factory = new Factory(modelManager);
            const serializer = new Serializer(factory, modelManager);
            const vehicle = factory.newResource('org.gov.uk.dvla', 'Vehicle', 'ABC');
            const vehicleDetails = factory.newConcept('org.gov.uk.dvla', 'VehicleDetails');
            vehicleDetails.make = 'Mercedes';
            vehicleDetails.modelType = 'C220';
            vehicleDetails.colour = 'Dark Blue';
            vehicle.vehicleDetails = vehicleDetails;
            vehicle.vehicleStatus = 'ACTIVE';

            const privateOwner = factory.newRelationship('org.acme.vehicle.lifecycle', 'PrivateOwner', 'dan');
            vehicle.owner = privateOwner;

            vehicle.validate();
            const jsonObj = serializer.toJSON(vehicle);
            //console.log(JSON.stringify(jsonObj));
            const result = serializer.fromJSON(jsonObj);
            result.getType().should.equal('Vehicle');
            result.validate();
        });
    });
});
