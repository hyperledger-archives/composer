import { Injectable } from '@angular/core';
import { Http, RequestOptions, URLSearchParams } from '@angular/http';

import { AdminService } from './admin.service';
import { ClientService } from './client.service';
import { AlertService } from '../basic-modals/alert.service';

import { BusinessNetworkDefinition } from 'composer-common';
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

    public getSampleList() {
        return this.http.get(PLAYGROUND_API + '/api/getSampleList')
            .toPromise()
            .then((response) => {
                return response.json();
            })
            .catch((error) => {
                throw(error);
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

    public deployBusinessNetwork(businessNetworkDefinition: BusinessNetworkDefinition, networkName: string, networkDescription: string): Promise<void> {
        let packageJson = businessNetworkDefinition.getMetadata().getPackageJson();
        packageJson.name = networkName;
        packageJson.description = networkDescription;

        let newNetwork = this.buildNetwork(networkName, networkDescription, packageJson, businessNetworkDefinition);

        // we should already be the PeerAdmin at this point, but just to check
        let roles = this.identityCardService.getCurrentIdentityCard().getRoles();
        if (!roles.includes('PeerAdmin')) {
            return Promise.reject('The current identity does not have the role PeerAdmin, this role is required to install the business network');
        }
        return this.adminService.connectWithoutNetwork(true)
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Installing Business Network'
                });
                return this.adminService.install(newNetwork.getName());
            })
            .then(() => {
                let connectionProfile = this.identityCardService.getCurrentIdentityCard().getConnectionProfile();
                let qpn = this.identityCardService.getQualifiedProfileName(connectionProfile);
                let channelAdminCardRef = this.identityCardService.getIdentityCardRefsWithProfileAndRole(qpn, 'ChannelAdmin')[0];

                return this.identityCardService.setCurrentIdentityCard(channelAdminCardRef);
            })
            .then(() => {
                return this.adminService.connectWithoutNetwork(true);
            })
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Starting Business Network'
                });

                return this.adminService.start(newNetwork);
            })
            .then(() => {
                return this.clientService.refresh(newNetwork.getName());
            })
            .then(() => {
                return this.clientService.reset();
            })
            .then(() => {
                return this.identityCardService.createIdentityCard('admin', newNetwork.getName(), 'admin', 'adminpw', this.identityCardService.getCurrentIdentityCard().getConnectionProfile(), this.identityCardService.getCurrentIdentityCard(), []);
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
        let currentBusinessNetworkName = this.clientService.getBusinessNetworkName();
        let currentBusinessNetworkDescription = this.clientService.getBusinessNetworkDescription();

        let packageJson = businessNetworkDefinition.getMetadata().getPackageJson();
        packageJson.name = currentBusinessNetworkName;
        packageJson.description = currentBusinessNetworkDescription;

        let newNetwork = this.buildNetwork(currentBusinessNetworkName, currentBusinessNetworkDescription, packageJson, businessNetworkDefinition);

        return this.adminService.connect(currentBusinessNetworkName, true)
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Updating business network'
                });

                return this.adminService.update(newNetwork);
            })
            .then(() => {
                return this.clientService.refresh(newNetwork.getName());
            })
            .then(() => {
                return this.clientService.reset();
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
