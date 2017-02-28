import {Injectable} from '@angular/core';
import {Http}    from '@angular/http';

import * as Octokat from 'octokat'

import {AdminService} from './admin.service';
import {ClientService} from './client.service';

import {BusinessNetworkDefinition} from 'composer-admin';
import {AclFile} from 'composer-common';

const initialModelFile = `/**
 * Defines a data model for a blind vehicle auction
 */
namespace org.acme.vehicle.auction

asset Vehicle identified by vin {
  o String vin
  --> Member owner
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

abstract participant User identified by email {
  o String email
  o String firstName
  o String lastName
}

participant Member extends User {
  o Double balance
}

participant Auctioneer extends User {
}

transaction Offer identified by transactionId {
  o String transactionId
  o Double bidPrice
  --> VehicleListing listing
  --> Member member
}

transaction CloseBidding identified by transactionId {
  o String transactionId
  --> VehicleListing listing
}`;

const initialScriptFile = `/*
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

/**
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
            buyer = highestOffer.member;
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
            return getParticipantRegistry('org.acme.vehicle.auction.Member')
        })
        .then(function(userRegistry) {
            // save the buyer
            if (listing.state == 'SOLD') {
                return userRegistry.updateAll([buyer, seller]);
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
}`;

const initialAclFile = `/**
 * Access Control List for the auction network.
 */
Auctioneer | org.acme.vehicle.auction | ALL | org.acme.vehicle.auction.Auctioneer | (true) | ALLOW | Allow the auctioneer full access
Member | org.acme.vehicle.auction | READ | org.acme.vehicle.auction.Member | (true) | ALLOW | Allow the member read access
VehicleOwner | org.acme.vehicle.auction.Vehicle:v | ALL | org.acme.vehicle.auction.Member:u | (v.owner.getIdentifier() == u.getIdentifier()) | ALLOW | Allow the owner of a vehicle total access
VehicleListingOwner | org.acme.vehicle.auction.VehicleListing:v | ALL | org.acme.vehicle.auction.Member:u | (v.vehicle.owner.getIdentifier() == u.getIdentifier()) | ALLOW | Allow the owner of a vehicle total access to their vehicle listing\n`;

@Injectable()
export class SampleBusinessNetworkService {

  private octo;
  private socket;
  private connected: boolean = false;

  public OPEN_SAMPLE: boolean = false;
  public RATE_LIMIT_MESSAGE = 'The rate limit to github api has been exceeded, to fix this problem setup oauth as documented <a href="https://fabric-composer.github.io/tasks/github-oauth.html" target="_blank">here</a>';
  public NO_CLIENT_ID = 'The client id for the github api has not been set, to fix this problem setup ouath as documented <a href="https://fabric-composer.github.io/tasks/github-oauth.html" target="_blank">here</a>';
  public CLIENT_ID = null;

  constructor(private adminService: AdminService,
              private clientService: ClientService,
              private http: Http) {
  }


  isOAuthEnabled(): Promise<boolean> {
    console.log(PLAYGROUND_API);
    //let bob = PLAYGROUND_API;
    return this.http.get(PLAYGROUND_API + '/api/isOAuthEnabled')
      .toPromise()
      .then((response) => {
        let enabled: boolean = response.json();
        //if we aren't doing oauth then we need to setup github without token
        if (!enabled) {
          this.setUpGithub(null);
        }
        return enabled;
      })
      .catch((error) => {
        throw(error);
      });
  }

  getGithubClientId(): Promise<string> {
    if (this.CLIENT_ID) {
      return Promise.resolve(this.CLIENT_ID);
    }

    return this.http.get(PLAYGROUND_API + '/api/getGithubClientId')
      .toPromise()
      .then((response) => {
        this.CLIENT_ID = response.json();
        return this.CLIENT_ID;
      })
      .catch((error) => {
        throw(error);
      });
  }

  getNpmInfo(name): Promise<any> {
    return this.http.get(PLAYGROUND_API + '/api/getNpmInfo/' + name)
      .toPromise()
      .then((response) => {
        return response.json();
      })
      .catch((error) => {
        throw error;
      });
  }

  setUpGithub(accessToken: string) {
    if (accessToken) {
      this.octo = new Octokat({token: accessToken});
    } else {
      this.octo = new Octokat();
    }
  }

  isAuthenticatedWithGitHub(): boolean {
    return this.octo ? true : false;
  }

  private getModelsInfoMonoRepo(owner: string, repository: string, models: any): Promise<any> {
    let modelNames: string[] = [];
    models.items.forEach((modelContainer) => {
      modelNames.push(modelContainer.name);
    });

    let infoPromises: Promise<any>[] = [];
    modelNames.forEach((modelName) => {
      let path = 'packages/' + modelName + '/';
      infoPromises.push(this.getSampleNetworkInfo(owner, repository, path));
    });

    return Promise.all(infoPromises)
      .then((results) => {
        return results;
      })
      .catch((error) => {
        if (error.message)
          throw error
      });
  }

  public getModelsInfo(owner: string, repository: string): Promise<any> {
    if (!this.octo) {
      return Promise.reject('no connection to github');
    }
    let repo = this.octo.repos(owner, repository);

    return repo.contents('packages').fetch()
      .then((result) => {
        return this.getModelsInfoMonoRepo(owner, repository, result);
      })
      .catch((error) => {
        if (error.status == '404') {
          return this.getSampleNetworkInfo(owner, repository, '')
            .then((info) => {
              let infoArray = [];
              infoArray.push(info);
            })
        } else {
          throw error;
        }
      });
  }

  public getSampleNetworkInfo(owner: string, repository: string, path: string): Promise<any> {
    if (!this.octo) {
      return Promise.reject('no connection to github');
    }

    let repo = this.octo.repos(owner, repository);

    return repo.contents(path + 'package.json').fetch()
      .then((info) => {
        let decodedString = atob(info.content);
        let contentInfo = JSON.parse(decodedString);
        //needed to know where to look in the repository for the files
        contentInfo.composerPath = path;
        return contentInfo;
      })
      .catch((error) => {
        throw error
      });
  }

  public getDependencyModel(owner: string, repository: string, dependencyName: string): Promise<any> {
    if (!this.octo) {
      return Promise.reject('no connection to github');
    }

    let repo = this.octo.repos(owner, repository);
    return repo.contents('packages').fetch()
    //in this case we have a mono-repo so need to find the path to the model
      .then((result) => {
        let foundItem = result.items.find((item) => {
          return item.name.toLowerCase() === dependencyName;
        });

        return this.getModel(owner, repository, 'packages/' + foundItem.name + '/');
      })
      .catch((error) => {
        // we don't have a mono-repo so just get the model
        if (error.status == '404') {
          return this.getModel(owner, repository, '');
        } else {
          throw error;
        }
      });
  }

  public getModel(owner: string, repository: string, path: string): Promise<any> {
    if (!this.octo) {
      return Promise.reject('no connection to github');
    }

    let repo = this.octo.repos(owner, repository);
    return repo.contents(path + 'models').fetch()
      .then((models) => {
        let modelFilePromises: Promise<any>[] = [];
        models.items.forEach((model) => {
          modelFilePromises.push(repo.contents(model.path).fetch());
        });
        return Promise.all(modelFilePromises);
      })
      .then((modelFiles) => {

        let fileArray: string[] = [];

        modelFiles.forEach((file) => {
          let decodedString = atob(file.content);
          fileArray.push(decodedString);
        });

        return fileArray;
      })
      .catch((error) => {
        throw error;
      });
  }

  public getSampleNetworkDependencies(dependencies: any): Promise<any> {
    let dependencyPromises: Promise<any>[] = [];
    let dependencyNames = Object.keys(dependencies);
    dependencyNames.forEach((dependency) => {
      dependencyPromises.push(this.getNpmInfo(dependency));
    });

    return Promise.all(dependencyPromises)
      .then((results) => {
        let modelsPromises: Promise<any>[] = [];
        results.forEach((npmInfo)=> {
          //TODO: remove hacky stuff to make work with url
          const github = 'git+https://github.com/';
          const git = '.git';
          let unparsed = npmInfo.repository.url;
          //  let url = unparsed.substring(git.length, unparsed.length - git.length);
          let sortOfParsed = unparsed.substring(github.length, unparsed.length - git.length);
          let split = sortOfParsed.split('/');
          let owner = split[0];
          let repo = split[1];
          modelsPromises.push(this.getDependencyModel(owner, repo, npmInfo.name));
        });

        return Promise.all(modelsPromises)
          .then((results) => {
            //put all models into one array for easier processing later
            let allModels = [];
            results.forEach((models) => {
              Array.prototype.push.apply(allModels, models);
            });

            return allModels;
          })
      })
      //TODO: do something more sensible with this
      .catch((error) => {
        throw error
      });
  }

  private getScripts(owner: string, repository: string, path: string): Promise<any> {
    if (!this.octo) {
      return Promise.reject('no connection to github');
    }

    let repo = this.octo.repos(owner, repository);

    let scriptFileData = [];
    return repo.contents(path + 'lib').fetch()
      .then((scripts) => {
        let scriptFilePromises: Promise<any>[] = [];
        scripts.items.forEach((script) => {
          scriptFileData.push({name: script.name});
          scriptFilePromises.push(repo.contents(script.path).fetch());
        });
        return Promise.all(scriptFilePromises);
      })
      .then((scriptFiles) => {
        for (let i = 0; i < scriptFiles.length; i++) {
          let decodedString = atob(scriptFiles[i].content);
          scriptFileData[i].data = decodedString;
        }
        return scriptFileData;
      })
      .catch((error) => {
        //don't need scripts files to be valid
        if (error.status == '404') {
          return Promise.resolve();
        }
        throw error;
      });
  }

  private getAcls(owner: string, repository: string, path: string): Promise<any> {
    if (!this.octo) {
      return Promise.reject('no connection to github');
    }

    let repo = this.octo.repos(owner, repository);

    return repo.contents(path + 'permissions.acl').fetch()
      .then((permissions) => {
        let decodedString = atob(permissions.content);
        let aclFileData = {
          name: 'permissions.acl',
          data: decodedString
        };
        return aclFileData;
      })
      .catch((error) => {
        //don't need to have a permissions file to be valid
        if (error.status == '404') {
          return Promise.resolve();
        }
        throw error
      });
  }

  public deployInitialSample(): Promise<any> {
    this.adminService.busyStatus$.next('Deploying sample business network ...');
    let businessNetworkDefinition = new BusinessNetworkDefinition('org.acme.biznet@0.0.1', 'Acme Business Network');
    let modelManager = businessNetworkDefinition.getModelManager();
    modelManager.addModelFile(initialModelFile);
    let scriptManager = businessNetworkDefinition.getScriptManager();
    let thisScript = scriptManager.createScript('lib/logic.js', 'JS', initialScriptFile);
    scriptManager.addScript(thisScript);
    let aclManager = businessNetworkDefinition.getAclManager();
    let aclFile = new AclFile('permissions.acl', modelManager, initialAclFile);
    aclManager.setAclFile(aclFile);
    return this.deployBusinessNetwork(businessNetworkDefinition);
  }

  public deploySample(owner: string, repository: string, chosenNetwork: any): Promise < any > {
    this.adminService.busyStatus$.next('Deploying sample business network ...');

    let sampleNetworkPromises: Promise<any>[] = [];
    let path = chosenNetwork.composerPath;

    if (!chosenNetwork.dependencies) {
      sampleNetworkPromises.push(this.getModel(owner, repository, path));
    }
    else {
      sampleNetworkPromises.push(this.getSampleNetworkDependencies(chosenNetwork.dependencies))
    }
    sampleNetworkPromises.push(this.getScripts(owner, repository, path));
    sampleNetworkPromises.push(this.getAcls(owner, repository, path));

    return Promise.all(sampleNetworkPromises)
      .then((results) => {

        let models = results[0];
        let scripts = results[1];
        let acls = results[2];

        let businessNetworkDefinition = new BusinessNetworkDefinition('org.acme.biznet@0.0.1', 'Acme Business Network');
        let modelManager = businessNetworkDefinition.getModelManager();
        models.forEach((model) => {
          modelManager.addModelFile(model);
        });

        let scriptManager = businessNetworkDefinition.getScriptManager();
        scripts.forEach((script) => {
          let thisScript = scriptManager.createScript(script.name, 'JS', script.data);
          scriptManager.addScript(thisScript);
        });

        if (acls) {
          let aclManager = businessNetworkDefinition.getAclManager();
          let aclFile = new AclFile(acls.name, modelManager, acls.data);
          aclManager.setAclFile(aclFile);
        }
        return this.deployBusinessNetwork(businessNetworkDefinition);
      });
  }

  public deployBusinessNetwork(businessNetworkDefinition: BusinessNetworkDefinition): Promise<any> {
    return this.adminService.update(businessNetworkDefinition)
      .then(() => {
        return this.clientService.refresh();
      })
      .then(() => {
        return this.clientService.reset();
      })
      .catch((error) => {
        throw error;
      });
  }

}
