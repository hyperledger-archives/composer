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
import { FileService } from './file.service';
import { AlertService } from '../basic-modals/alert.service';

import { BusinessNetworkDefinition, IdCard } from 'composer-common';
import { IdentityCardService } from './identity-card.service';

@Injectable()
export class SampleBusinessNetworkService {

    private static readonly installNetworkStatusText = '<p>Installing the business network requires a business network card with the PeerAdmin role.</p>';
    private static readonly startNetworkStatusText = '<p>Starting a business network requires a business network card with the ChannelAdmin role.</p>';
    private static readonly upgradeNetworkStatusText = '<p>Upgrading a business network requires a business network card with the ChannelAdmin role.</p>';

    constructor(private adminService: AdminService,
                private clientService: ClientService,
                private alertService: AlertService,
                private identityCardService: IdentityCardService,
                private fileService: FileService,
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

        const showExtendedStatus = (peerAdminCard.getConnectionProfile()['x-type'] !== 'web');

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
                let status: any = {
                    title: 'Installing Business Network',
                    force: true
                };
                if (showExtendedStatus) {
                    status.header = 'Your new business network is being deployed';
                    status.title = 'Installing Business Network using ' + peerAdminCardRef;
                    status.text = SampleBusinessNetworkService.installNetworkStatusText;
                    status.card = peerAdminCard;
                }
                this.alertService.busyStatus$.next(status);
                return this.adminService.install(newNetwork);
            })
            .then(() => {
                return this.adminService.connect(channelAdminCardRef, channelAdminCard, true);
            })
            .then(() => {
                let status: any = {
                    title: 'Starting Business Network',
                    force: true
                };
                if (showExtendedStatus) {
                    status.header = 'Your new business network is being deployed';
                    status.title = 'Starting Business Network using ' + channelAdminCardRef;
                    status.text = SampleBusinessNetworkService.startNetworkStatusText;
                    status.card = channelAdminCard;
                    status. progress = [
                        'Business Network installed using ' + peerAdminCardRef
                    ];
                }
                this.alertService.busyStatus$.next(status);

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
                let status: any = {
                    title: 'Installing Business Network',
                    force: true
                };
                if (showExtendedStatus) {
                    status.header = 'Your changes are being deployed';
                    status.title = 'Installing Business Network using ' + peerCardRef;
                    status.text = SampleBusinessNetworkService.installNetworkStatusText;
                    status.card = peerCard;
                }
                this.alertService.busyStatus$.next(status);
                return this.adminService.install(businessNetworkDefinition);
            })
            .then(() => {
                return this.adminService.connect(channelCardRef, channelCard, true);
            })
            .then(() => {
                let status: any = {
                    title: 'Upgrading Business Network',
                    force: true
                };
                if (showExtendedStatus) {
                    status.header = 'Your changes are being deployed';
                    status.title = 'Upgrading Business Network using ' + channelCardRef;
                    status.text = SampleBusinessNetworkService.upgradeNetworkStatusText;
                    status.card = channelCard;
                    status. progress = [
                        'Business Network installed using ' + peerCardRef
                    ];
                }
                this.alertService.busyStatus$.next(status);

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
