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
import { Injectable } from '@angular/core';
import { Http, RequestOptions, URLSearchParams } from '@angular/http';

import { AdminService } from './admin.service';
import { ClientService } from './client.service';
import { AlertService } from '../basic-modals/alert.service';

import { BusinessNetworkDefinition, IdCard } from 'composer-common';
import { IdentityCardService } from './identity-card.service';

@Injectable()
export class SampleBusinessNetworkService {

    constructor(private adminService: AdminService,
                private clientService: ClientService,
                private alertService: AlertService,
                private identityCardService: IdentityCardService,
                private http: Http) {
    }

    public createNewBusinessDefinition(name, description, packageJson, readme): BusinessNetworkDefinition {
        return new BusinessNetworkDefinition(name, description, packageJson, readme);
    }

    public getSampleList(): Promise<any> {
        const URL = PLAYGROUND_API + '/api/getSampleList';
        return this.http.get(URL)
            .toPromise()
            .then((response) => {
                return response.json();
            })
            .catch((error) => {
                throw('Error connecting to: ' + URL);
            });
    }

    public getChosenSample(chosenNetwork): Promise<BusinessNetworkDefinition> {
        let params: URLSearchParams = new URLSearchParams();

        let paramNames = Object.keys(chosenNetwork);

        paramNames.forEach((paramName) => {
            params.set(paramName, chosenNetwork[paramName]);
        });

        let requestOptions = new RequestOptions();
        requestOptions.search = params;

        return this.http.get(PLAYGROUND_API + '/api/downloadSample', requestOptions)
            .toPromise()
            .then((response) => {
                return BusinessNetworkDefinition.fromArchive((<any> response)._body);
            })
            .catch((error) => {
                throw(error);
            });
    }

    public deployBusinessNetwork(businessNetworkDefinition: BusinessNetworkDefinition, cardName: string, networkName: string, networkDescription: string, networkId: string, networkSecret: string, credentials): Promise<void> {
        let packageJson = businessNetworkDefinition.getMetadata().getPackageJson();
        packageJson.name = networkName;
        packageJson.description = networkDescription;

        let peerAdminCardRef: string = this.identityCardService.getCurrentCardRef();
        let peerAdminCard = this.identityCardService.getIdentityCard(peerAdminCardRef);

        const connectionProfile = this.identityCardService.getIdentityCard(peerAdminCardRef).getConnectionProfile();
        const qpn = this.identityCardService.getQualifiedProfileName(connectionProfile);
        const channelAdminCardRef = this.identityCardService.getAdminCardRef(qpn, IdentityCardService.channelAdminRole);
        const channelAdminCard = this.identityCardService.getIdentityCard(channelAdminCardRef);

        let newNetwork = this.buildNetwork(networkName, networkDescription, packageJson, businessNetworkDefinition);

        networkId = networkId || 'admin';

        let networkAdmin = {
            userName: networkId
        };

        if (credentials) {
            networkAdmin['certificate'] = credentials.certificate;
        } else if (networkSecret) {
            networkAdmin['enrollmentSecret'] = networkSecret;
        } else {
            networkAdmin['enrollmentSecret'] = 'adminpw';
        }

        cardName = cardName || networkId + '@' + networkName;

        return Promise.resolve()
            .then(() => {
                return this.adminService.hasCard(cardName);
            })
            .then((cardExists) => {
                if (cardExists) {
                    throw new Error('Card already exists: ' + cardName);
                }

                let card = this.identityCardService.getIdentityCard(peerAdminCardRef);
                return this.adminService.connect(peerAdminCardRef, card, true);
            })
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Your new business network is being deployed',
                    text: 'Installing business network using ' + peerAdminCardRef + ' (1/2)',
                    force: true
                });
                return this.adminService.install(newNetwork);
            })
            .then(() => {
                return this.adminService.connect(channelAdminCardRef, channelAdminCard, true);
            })
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Your new business network is being deployed',
                    text: 'Starting business network using ' + channelAdminCardRef + ' (2/2)',
                    force: true
                });

                return this.adminService.start(newNetwork.getName(), newNetwork.getVersion(), {
                    networkAdmins: [networkAdmin]
                });
            })
            .then((createdCards: Map<string, IdCard>) => {
                let card = createdCards.get(networkId);

                return this.adminService.importCard(cardName, card);
            })
            .then(() => {
                this.alertService.busyStatus$.next(null);
            })
            .catch((error) => {
                this.alertService.busyStatus$.next(null);
                throw error;
            });
    }

    public upgradeBusinessNetwork(businessNetworkDefinition: BusinessNetworkDefinition, peerCardRef: string, channelCardRef: string): Promise<void> {
        const currentCard = this.identityCardService.getCurrentIdentityCard();
        const currentCardRef = this.identityCardService.getCurrentCardRef();
        const peerCard = this.identityCardService.getIdentityCard(peerCardRef);
        const channelCard = this.identityCardService.getIdentityCard(channelCardRef);

        const showExtendedStatus = (currentCard.getConnectionProfile()['x-type'] !== 'web');

        return this.adminService.connect(peerCardRef, peerCard, true)
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Your business network is being upgraded',
                    text: 'Installing business network using ' + peerCardRef + ' (1/2)',
                    force: true
                });

                return this.adminService.install(businessNetworkDefinition);
            })
            .then(() => {
                return this.adminService.connect(channelCardRef, channelCard, true);
            })
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Your new business network is being upgraded',
                    text: 'Uprading business network using ' + channelCardRef + ' (2/2)',
                    force: true
                });

                return this.adminService.upgrade(businessNetworkDefinition.getName(), businessNetworkDefinition.getVersion());
            })
            .then(() => {
                // switch back to original card
                return this.adminService.connect(currentCardRef, currentCard, true);
            })
            .then(() => {
                return this.clientService.refresh();
            })
            .then(() => {
                this.alertService.busyStatus$.next(null);
            })
            .catch((error) => {
                this.alertService.busyStatus$.next(null);
                throw error;
            });
    }

    buildNetwork(businessNetworkName: string, businessNetworkDescription: string, packageJson: object, businessNetworkDefinition: BusinessNetworkDefinition) {
        let newNetwork = this.createNewBusinessDefinition(businessNetworkName, businessNetworkDescription, packageJson, businessNetworkDefinition.getMetadata().getREADME());

        let modelFiles = this.clientService.filterModelFiles(businessNetworkDefinition.getModelManager().getModelFiles());

        newNetwork.getModelManager().addModelFiles(modelFiles);
        businessNetworkDefinition.getScriptManager().getScripts().forEach((script) => {
            newNetwork.getScriptManager().addScript(script);
        });

        if (businessNetworkDefinition.getAclManager().getAclFile()) {
            newNetwork.getAclManager().setAclFile(businessNetworkDefinition.getAclManager().getAclFile());
        }

        if (businessNetworkDefinition.getQueryManager().getQueryFile()) {
            newNetwork.getQueryManager().setQueryFile(businessNetworkDefinition.getQueryManager().getQueryFile());
        }

        return newNetwork;
    }
}
