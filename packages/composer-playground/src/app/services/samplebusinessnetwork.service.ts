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

        let channelAdminCardRef: string;
        let channelAdminCard: IdCard;
        let peerAdminCardRef: string = this.identityCardService.getCurrentCardRef();

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
                    title: 'Installing Business Network',
                    force: true
                });
                return this.adminService.install(newNetwork.getName());
            })
            .then(() => {
                let connectionProfile = this.identityCardService.getIdentityCard(peerAdminCardRef).getConnectionProfile();
                let qpn = this.identityCardService.getQualifiedProfileName(connectionProfile);
                channelAdminCardRef = this.identityCardService.getIdentityCardRefsWithProfileAndRole(qpn, 'ChannelAdmin')[0];

                channelAdminCard = this.identityCardService.getIdentityCard(channelAdminCardRef);
                return this.adminService.connect(channelAdminCardRef, channelAdminCard, true);
            })
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Starting Business Network',
                    force: true
                });

                return this.adminService.start(newNetwork, {
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

    public updateBusinessNetwork(businessNetworkDefinition: BusinessNetworkDefinition): Promise<void> {
        let currentBusinessNetworkName = this.fileService.getBusinessNetworkName();
        let currentBusinessNetworkDescription = this.fileService.getBusinessNetworkDescription();

        let packageJson = businessNetworkDefinition.getMetadata().getPackageJson();
        packageJson.name = currentBusinessNetworkName;
        packageJson.description = currentBusinessNetworkDescription;

        let newNetwork = this.buildNetwork(currentBusinessNetworkName, currentBusinessNetworkDescription, packageJson, businessNetworkDefinition);

        let cardName = this.identityCardService.getCurrentCardRef();
        let card = this.identityCardService.getCurrentIdentityCard();

        return this.adminService.connect(cardName, card, true)
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Updating business network'
                });

                return this.adminService.update(newNetwork);
            })
            .then(() => {
                return this.clientService.refresh();
            })
            .then(() => {
                return this.adminService.reset(newNetwork.getName());
            })
            .then(() => {
                this.alertService.busyStatus$.next(null);
            })
            .catch((error) => {
                this.alertService.busyStatus$.next(null);
                throw error;
            });
    }

    buildNetwork(businessNetworkName: string, businessNetworkDescription, packageJson, businessNetworkDefinition) {
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
