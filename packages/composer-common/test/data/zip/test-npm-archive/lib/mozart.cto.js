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

/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/
/*eslint-disable no-var*/

/**
* A transaction processor for AnimalMovementDeparture
* @param  {com.composer.AnimalMovementDeparture} movementDeparture - the transaction to be processed
*/
function onAnimalMovementDeparture(movementDeparture) {
    console.log('onAnimalMovementDeparture');
    if(movementDeparture.animal.movementStatus !== 'IN_FIELD'){
        throw new Error('Animal is already IN_TRANSIT');
    }

     // set the movement status of the animal
    movementDeparture.animal.movementStatus = 'IN_TRANSIT';

     // save the animal
    var ar = getAssetRegistry('com.composer.Animal');
    ar.update(movementDeparture.animal);

     // add the animal to the incoming animals of the
     // destination business
    if(movementDeparture.to.incomingAnimals) {
        movementDeparture.to.incomingAnimals.push(movementDeparture.animal);
    }
    else {
        movementDeparture.to.incomingAnimals = [movementDeparture.animal];
    }

     // save the business
    var br = getAssetRegistry('com.composer.Business');
    br.update(movementDeparture.to);
}

/**
* A transaction processor for AnimalMovementArrival
* @param  {com.composer.AnimalMovementArrival} movementArrival - the transaction to be processed
*/
function onAnimalMovementArrival(movementArrival) {
    console.log('onAnimalMovementArrival');

    if(movementArrival.animal.movementStatus !== 'IN_TRANSIT'){
        throw new Error('Animal is not IN_TRANSIT');
    }

     // set the movement status of the animal
    movementArrival.animal.movementStatus = 'IN_FIELD';

     // set the new owner of the animal
     // to the owner of the 'to' business
    movementArrival.animal.owner = movementArrival.to.owner;

     // set the new location of the animal
    movementArrival.animal.location = movementArrival.arrivalField;

     // save the animal
    var ar = getAssetRegistry('com.composer.Animal');
    ar.update(movementArrival.animal);

     // remove the animal from the incoming animals
     // of the 'to' business
    if(!movementArrival.to.incomingAnimals) {
        throw new Error('Incoming business should have incomingAnimals on AnimalMovementArrival.');
    }

    movementArrival.to.incomingAnimals = movementArrival.to.incomingAnimals
      .filter(function(animal) {
          return animal.animalId !== movementArrival.animal.animalId;
      });

      // save the business
    var br = getAssetRegistry('com.composer.Business');
    br.update(movementArrival.to);
}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/
