import { Injectable } from '@angular/core';
import { Http, RequestOptions, URLSearchParams } from '@angular/http';

import { AdminService } from './admin.service';
import { ClientService } from './client.service';
import { FileService } from './file.service';
import { AlertService } from '../basic-modals/alert.service';

import { BusinessNetworkDefinition } from 'composer-common';
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

    generateBootstrapTransactions(businessNetworkDefinition: BusinessNetworkDefinition, identityName: string, credentials): Object[] {
        const factory = businessNetworkDefinition.getFactory();
        const serializer = businessNetworkDefinition.getSerializer();
        const participant = factory.newResource('org.hyperledger.composer.system', 'NetworkAdmin', identityName);
        const targetRegistry = factory.newRelationship('org.hyperledger.composer.system', 'ParticipantRegistry', participant.getFullyQualifiedType());
        const addParticipantTransaction = factory.newTransaction('org.hyperledger.composer.system', 'AddParticipant');
        Object.assign(addParticipantTransaction, {
            resources: [participant],
            targetRegistry
        });

        let identityTransaction;

        if (!credentials) {
            identityTransaction = factory.newTransaction('org.hyperledger.composer.system', 'IssueIdentity');
            Object.assign(identityTransaction, {
                participant: factory.newRelationship('org.hyperledger.composer.system', 'NetworkAdmin', identityName),
                identityName
            });
        } else {
            let certificate = credentials.certificate;

            identityTransaction = factory.newTransaction('org.hyperledger.composer.system', 'BindIdentity');
            Object.assign(identityTransaction, {
                participant: factory.newRelationship('org.hyperledger.composer.system', 'NetworkAdmin', identityName),
                certificate
            });
        }

        const result = [
            addParticipantTransaction,
            identityTransaction
        ].map((bootstrapTransaction) => {
            return serializer.toJSON(bootstrapTransaction);
        });
        return result;
    }

    public deployBusinessNetwork(businessNetworkDefinition: BusinessNetworkDefinition, networkName: string, networkDescription: string, networkId: string, networkSecret: string, credentials): Promise<string> {
        let packageJson = businessNetworkDefinition.getMetadata().getPackageJson();
        packageJson.name = networkName;
        packageJson.description = networkDescription;

        let newCardRef: string;
        let channelAdminCardRef: string;

        let newNetwork = this.buildNetwork(networkName, networkDescription, packageJson, businessNetworkDefinition);

        // we should already be the PeerAdmin at this point, but just to check
        let roles = this.identityCardService.getCurrentIdentityCard().getRoles();
        if (!roles.includes('PeerAdmin')) {
            return Promise.reject('The current identity does not have the role PeerAdmin, this role is required to install the business network');
        }
        return this.adminService.connectWithoutNetwork(true)
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Installing Business Network',
                    force: true
                });
                return this.adminService.install(newNetwork.getName());
            })
            .then(() => {
                let connectionProfile = this.identityCardService.getCurrentIdentityCard().getConnectionProfile();
                let qpn = this.identityCardService.getQualifiedProfileName(connectionProfile);
                channelAdminCardRef = this.identityCardService.getIdentityCardRefsWithProfileAndRole(qpn, 'ChannelAdmin')[0];

                return this.identityCardService.setCurrentIdentityCard(channelAdminCardRef);
            })
            .then(() => {
                return this.adminService.connectWithoutNetwork(true);
            })
            .then(() => {
                if (networkSecret) {
                    return this.identityCardService.createIdentityCard(networkId, newNetwork.getName(), networkSecret, this.identityCardService.getCurrentIdentityCard().getConnectionProfile())
                        .then((idCardRef: string) => {
                            newCardRef = idCardRef;
                            return this.identityCardService.setCurrentIdentityCard(idCardRef);
                        })
                        .then(() => {
                            return this.adminService.connectWithoutNetwork(true);
                        })
                        .then(() => {
                            let connectionProfile = this.identityCardService.getCurrentIdentityCard().getConnectionProfile();
                            let qpn = this.identityCardService.getQualifiedProfileName(connectionProfile);
                            return this.adminService.exportIdentity(qpn, networkId);
                        })
                        .then((retrievedCertificate) => {
                            credentials = {};
                            credentials.certificate = retrievedCertificate.certificate;
                            return this.identityCardService.setCurrentIdentityCard(channelAdminCardRef);
                        })
                        .then(() => {
                            return this.adminService.connectWithoutNetwork(true);
                        });
                } else if (credentials) {
                    return this.identityCardService.createIdentityCard(networkId, newNetwork.getName(), null, this.identityCardService.getCurrentIdentityCard().getConnectionProfile(), credentials)
                        .then((idCardRef: string) => {
                            newCardRef = idCardRef;
                        });
                } else {
                    networkId = 'admin';
                    return this.identityCardService.createIdentityCard(networkId, newNetwork.getName(), 'adminpw', this.identityCardService.getCurrentIdentityCard().getConnectionProfile())
                        .then((idCardRef: string) => {
                            newCardRef = idCardRef;
                        });
                }
            })
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Starting Business Network',
                    force: true
                });

                const bootstrapTransactions = this.generateBootstrapTransactions(businessNetworkDefinition, networkId, credentials);

                return this.adminService.start(newNetwork, {bootstrapTransactions});
            })
            .then(() => {
                this.alertService.busyStatus$.next(null);
                return newCardRef;
            })
            .catch((error) => {
                if (newCardRef) {
                    return this.identityCardService.deleteIdentityCard(newCardRef)
                        .then(() => {
                            this.alertService.busyStatus$.next(null);
                            return Promise.reject(error);
                        })
                        .catch(() => {
                            // Ignore error from deleting
                            this.alertService.busyStatus$.next(null);
                            return Promise.reject(error);
                        });
                } else {
                    this.alertService.busyStatus$.next(null);
                    throw error;
                }
            });
    }

    public updateBusinessNetwork(businessNetworkDefinition: BusinessNetworkDefinition): Promise<void> {
        let currentBusinessNetworkName = this.fileService.getBusinessNetworkName();
        let currentBusinessNetworkDescription = this.fileService.getBusinessNetworkDescription();

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
