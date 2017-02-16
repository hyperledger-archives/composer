import { Injectable } from '@angular/core';

import { AdminService } from './admin.service';
import { ClientService } from './client.service';

import { BusinessNetworkDefinition } from 'composer-admin';
import { AclFile } from 'composer-common';

const samples = [

  /**
   * Start of simple business network sample.
   */
  {
    name: 'Basic business network',
    description: 'A sample business network definition with a single asset, participant, and transaction.',
    models: [
      {
        name: 'lib/org.acme.biznet.cto',
        data:
`/**
 * Sample business network definition.
 */
namespace org.acme.biznet

asset SampleAsset identified by assetId {
  o String assetId
  --> SampleParticipant owner
  o String value
}

participant SampleParticipant identified by participantId {
  o String participantId
  o String firstName
  o String lastName
}

transaction SampleTransaction identified by transactionId {
  o String transactionId
  --> SampleAsset asset
  o String newValue
}`
      }
    ],
    scripts: [
      {
        name: 'lib/script.js',
        data:
`/**
 * Sample transaction processor function.
 */
function onSampleTransaction(sampleTransaction) {
  sampleTransaction.asset.value = sampleTransaction.newValue;
  return getAssetRegistry('org.acme.biznet.SampleAsset')
    .then(function (assetRegistry) {
      return assetRegistry.update(sampleTransaction.asset);
    });
}`
      }
    ],
    acl:
`/**
 * Sample access control list.
 */
Default | org.acme.biznet | ALL | ANY | (true) | ALLOW | Allow all participants access to all resources\n`,
    setup: function (businessNetworkConnection) {
      let factory = businessNetworkConnection.getBusinessNetwork().getFactory();
      let participant1 = factory.newResource('org.acme.biznet', 'SampleParticipant', '1234');
      participant1.firstName = 'Alice';
      participant1.lastName = 'Anderson';
      let participant2 = factory.newResource('org.acme.biznet', 'SampleParticipant', '2345');
      participant2.firstName = 'Bob';
      participant2.lastName = 'Baxter';
      let participants = [participant1, participant2];
      let assets = [];
      for (let i = 0; i < 8; i++) {
        let asset = factory.newResource('org.acme.biznet', 'SampleAsset', `000${i + 1}`);
        if ((i % 2) === 0) {
          asset.owner = factory.newRelationship('org.acme.biznet', 'SampleParticipant', '1234');
        } else {
          asset.owner = factory.newRelationship('org.acme.biznet', 'SampleParticipant', '2345');
        }
        asset.value = 'default value';
        assets.push(asset);
      }
      let transactions = [];
      for (let i = 0; i < 4; i++) {
        let transaction = factory.newTransaction('org.acme.biznet', 'SampleTransaction');
        transaction.asset = factory.newRelationship('org.acme.biznet', 'SampleAsset', `000${(i * 2) + 1}`);
        transaction.newValue = `modified value ${i}`;
        transactions.push(transaction);
      }
      return businessNetworkConnection.getParticipantRegistry('org.acme.biznet.SampleParticipant')
        .then((participantRegistry) => {
          return participantRegistry.addAll(participants);
        })
        .then(() => {
          return businessNetworkConnection.getAssetRegistry('org.acme.biznet.SampleAsset');
        })
        .then((assetRegistry) => {
          return assetRegistry.addAll(assets);
        })
        .then(() => {
          return transactions.reduce((result, transaction) => {
            return result.then(() => {
              return businessNetworkConnection.submitTransaction(transaction);
            });
          }, Promise.resolve());
        });
    }
  },



  /**
   * Start of car auction business network sample.
   */
  {
    name: 'Car auction business network',
    description: 'A sample business network definition for a blind car auction scenario, where one participant can put a vehicle up for sale, and other participants can bid on that vehicle.',
    models: [
      {
        name: 'lib/auction.cto',
        data:
`/**
 * Defines a data model for a blind vehicle auction
 */
namespace org.acme.vehicle.auction

asset Vehicle identified by vin {
  o String vin
  --> User owner
}

enum ListingState {
  o FOR_SALE
  o RESERVE_NOT_MET
  o SOLD
}

asset VehicleListing identified by listingId {
  o String listingId
  o Double reservePrice
  o String description
  o ListingState state
  o Offer[] offers optional
  --> Vehicle vehicle
}

participant User identified by email {
  o String email
  o String firstName
  o String lastName
  o Double balance
}

transaction Offer identified by transactionId {
  o String transactionId
  o Double bidPrice
  --> VehicleListing listing
  --> User user
}

transaction CloseBidding identified by transactionId {
  o String transactionId
  --> VehicleListing listing
}`
      }
    ],
    scripts: [
      {
        name: 'lib/logic.js',
        data:
`/**
 * Close the bidding for a vehicle listing and choose the
 * highest bid that is over the asking price
 * @param {org.acme.vehicle.auction.CloseBidding} closeBidding - the closeBidding transaction
 * @transaction
 */
function closeBidding(closeBidding) {

    var listing = closeBidding.listing;

    if (listing.state !== 'FOR_SALE') {
        throw new Error('Listing is not FOR SALE');
    }

    // by default we mark the listing as RESERVE_NOT_MET
    listing.state = 'RESERVE_NOT_MET';
    var highestOffer = null;
    var buyer = null;
    var seller = null;

    if (listing.offers) {
        // sort the bids by bidPrice
        listing.offers.sort(function(a, b) {
            return (b.bidPrice - a.bidPrice);
        });

        highestOffer = listing.offers[0];

        if (highestOffer.bidPrice >= listing.reservePrice) {
            // mark the listing as SOLD
            listing.state = 'SOLD';
            buyer = highestOffer.user;
            seller = listing.vehicle.owner;

            // update the balance of the seller
            console.log('#### seller balance before: ' + seller.balance);
            seller.balance += highestOffer.bidPrice;
            console.log('#### seller balance after: ' + seller.balance);

            // update the balance of the buyer
            console.log('#### buyer balance before: ' + buyer.balance);
            buyer.balance -= highestOffer.bidPrice;
            console.log('#### buyer balance after: ' + buyer.balance);

            // transfer the vehicle to the buyer
            listing.vehicle.owner = buyer;

            // clear the offers
            listing.offers = null;
        }
    }

    return getAssetRegistry('org.acme.vehicle.auction.Vehicle')
        .then(function(vehicleRegistry) {
            // save the vehicle
            if (highestOffer) {
                return vehicleRegistry.update(listing.vehicle);
            } else {
                return true;
            }
        })
        .then(function() {
            return getAssetRegistry('org.acme.vehicle.auction.VehicleListing')
        })
        .then(function(vehicleListingRegistry) {
            // save the vehicle listing
            return vehicleListingRegistry.update(listing);
        })
        .then(function() {
            return getParticipantRegistry('org.acme.vehicle.auction.User')
        })
        .then(function(userRegistry) {
            // save the buyer
            if (listing.state == 'SOLD') {
                return userRegistry.updateAll([buyer,seller]);
            } else {
                return true;
            }
        });
}

/**
 * Make an Offer for a VehicleListing
 * @param {org.acme.vehicle.auction.Offer} offer - the offer
 * @transaction
 */
function makeOffer(offer) {

    var listing = offer.listing;

    if (listing.state !== 'FOR_SALE') {
        throw new Error('Listing is not FOR SALE');
    }

    if (listing.offers == null) {
        listing.offers = [];
    }
    listing.offers.push(offer);

    return getAssetRegistry('org.acme.vehicle.auction.VehicleListing')
        .then(function(vehicleListingRegistry) {
            // save the vehicle listing
            return vehicleListingRegistry.update(listing);
        });
}`
      }
    ],
    acl:
`/**
 * Sample access control list.
 */
Default | org.acme.vehicle.auction | ALL | ANY | (true) | ALLOW | Allow all participants read access to all resources\n`,
    setup: null /* function (businessNetworkConnection) {

    } */
  }

]

@Injectable()
export class SampleService {

  public deployingPromise: Promise<any> = Promise.resolve();

  constructor(
    private adminService: AdminService,
    private clientService: ClientService
  ) {

  }

  getDefaultSample(): string {
    return samples[0].name;
  }

  getSampleNames(): string[] {
    return samples.map((sample) => { return sample.name; });
  }

  getSampleDescription(name: string) {
    let sample = samples.find((sample) => {
      return sample.name === name;
    });
    if (!sample) {
      throw new Error(`The sample '${name}' does not exist`);
    }
    return sample.description;
  }

  deploySample(name: string): Promise<any> {
    this.adminService.busyStatus$.next('Deploying sample business network ...');
    let sample = samples.find((sample) => {
      return sample.name === name;
    });
    if (!sample) {
      throw new Error(`The sample '${name}' does not exist`);
    }

    let businessNetworkDefinition = new BusinessNetworkDefinition('org.acme.biznet@0.0.1', 'Acme Business Network');
    let modelManager = businessNetworkDefinition.getModelManager();
    sample.models.forEach((model) => {
      modelManager.addModelFile(model.data);
    });
    let scriptManager = businessNetworkDefinition.getScriptManager();
    sample.scripts.forEach((script) => {
      let thisScript = scriptManager.createScript(script.name, 'JS', script.data);
      scriptManager.addScript(thisScript);
    });
    let aclManager = businessNetworkDefinition.getAclManager();
    if (sample.acl) {
      let aclFile = new AclFile('permissions.acl', modelManager, sample.acl);
      aclManager.setAclFile(aclFile);
    }

    this.deployingPromise = this.deployingPromise
      .then(() => {
        return this.adminService.update(businessNetworkDefinition);
      })
      .then(() => {
        return this.clientService.refresh();
      })
      .then(() => {
        return this.clientService.reset();
      })
      .then(() => {
        if (sample.setup) {
          this.adminService.busyStatus$.next('Creating sample data ...');
          let businessNetworkConnection = this.clientService.getBusinessNetworkConnection();
          return sample.setup(businessNetworkConnection);
        }
      });
    return this.deployingPromise;
  }

}
