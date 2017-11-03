import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';

import { AdminService } from './admin.service';
import { IdentityService } from './identity.service';
import { AlertService } from '../basic-modals/alert.service';
import { ConnectionProfileStoreService } from './connectionProfileStores/connectionprofilestore.service';

import { BusinessNetworkConnection } from 'composer-client';
import {
    BusinessNetworkDefinition,
    ModelFile,
    Script,
    AclFile,
    QueryFile,
    TransactionDeclaration
} from 'composer-common';

@Injectable()
export class ClientService {
    private businessNetworkConnection: BusinessNetworkConnection = null;
    private isConnected: boolean = false;
    private connectingPromise: Promise<any> = null;

    private currentBusinessNetwork: BusinessNetworkDefinition = null;

    constructor(private adminService: AdminService,
                private identityService: IdentityService,
                private alertService: AlertService,
                private localStorageService: LocalStorageService,
                private connectionProfileStoreService: ConnectionProfileStoreService) {
    }

    // horrible hack for tests
    createBusinessNetwork(identifier, description, packageJson, readme) {
        return new BusinessNetworkDefinition(identifier, description, packageJson, readme);
    }

    getBusinessNetworkConnection(): BusinessNetworkConnection {
        if (!this.businessNetworkConnection) {
            this.businessNetworkConnection = new BusinessNetworkConnection({
                connectionProfileStore: this.connectionProfileStoreService.getConnectionProfileStore()
            });
        }
        return this.businessNetworkConnection;
    }

    getBusinessNetwork(): BusinessNetworkDefinition {
        if (!this.currentBusinessNetwork) {
            this.currentBusinessNetwork = this.getBusinessNetworkConnection().getBusinessNetwork();
        }

        return this.currentBusinessNetwork;
    }

    ensureConnected(name: string = null, force: boolean = false): Promise<any> {
        if (this.isConnected && !force) {
            return Promise.resolve();
        } else if (this.connectingPromise) {
            return this.connectingPromise;
        }

        let connectionProfile = this.identityService.getCurrentConnectionProfile();

        this.alertService.busyStatus$.next({
            title: 'Establishing connection',
            text: 'Using the connection profile ' + connectionProfile.name
        });

        let businessNetworkName: string;
        let userId = this.identityService.getCurrentUserName();

        if (!name) {
            try {
                let businessNetwork = this.getBusinessNetwork();
                if (businessNetwork) {
                    businessNetworkName = this.getBusinessNetwork().getName();
                }
            } catch (error) {
                console.log('business network name not set yet so using from local storage');
            } finally {
                if (!businessNetworkName) {
                    businessNetworkName = this.getSavedBusinessNetworkName(userId);
                }
            }
        } else {
            businessNetworkName = name;
        }

        this.connectingPromise = this.adminService.connect(businessNetworkName, force)
            .then(() => {
                return this.refresh(businessNetworkName);
            })
            .then(() => {
                console.log('connected');
                this.isConnected = true;
                this.connectingPromise = null;
                this.setSavedBusinessNetworkName(userId);
                this.alertService.busyStatus$.next(null);
            })
            .catch((error) => {
                this.alertService.busyStatus$.next(null);
                this.isConnected = false;
                this.connectingPromise = null;
                throw error;
            });
        return this.connectingPromise;
    }

    refresh(businessNetworkName): Promise<any> {
        this.currentBusinessNetwork = null;
        let connectionProfile = this.identityService.getCurrentConnectionProfile();
        let connectionProfileRef = this.identityService.getCurrentQualifiedProfileName();
        let enrollmentCredentials = this.identityService.getCurrentEnrollmentCredentials();
        const enrollmentSecret = enrollmentCredentials ? enrollmentCredentials.secret : null;
        const userName = this.identityService.getCurrentUserName();

        this.alertService.busyStatus$.next({
            title: 'Refreshing Connection',
            text: 'refreshing the connection to ' + connectionProfile.name
        });

        return this.getBusinessNetworkConnection().disconnect()
            .then(() => {
                return this.getBusinessNetworkConnection().connectWithDetails(connectionProfileRef, businessNetworkName, userName, enrollmentSecret);
            });
    }

    public disconnect() {
        this.isConnected = false;
        this.adminService.disconnect();
        return this.getBusinessNetworkConnection().disconnect();
    }

    public getBusinessNetworkFromArchive(buffer): Promise<BusinessNetworkDefinition> {
        return BusinessNetworkDefinition.fromArchive(buffer);
    }

    issueIdentity(userID, participantFQI, options): Promise<string> {
        let connectionProfile = this.identityService.getCurrentConnectionProfile();

        ['membershipServicesURL', 'peerURL', 'eventHubURL'].forEach((url) => {
            if (connectionProfile[url] && connectionProfile[url].match(/\.blockchain\.ibm\.com/)) {
                // Smells like Bluemix with their non-default affiliations.
                options.affiliation = 'group1';
            }
        });

        return this.getBusinessNetworkConnection().issueIdentity(participantFQI, userID, options);
    }

    revokeIdentity(identity) {
        // identity should be the full ValidatedResource object
        return this.getBusinessNetworkConnection().revokeIdentity(identity);
    }

    filterModelFiles(files) {
        return files.filter((model) => {
            return !model.isSystemModelFile();
        });
    }

    resolveTransactionRelationship(relationship): Promise<TransactionDeclaration> {
        let identifier = relationship.getIdentifier();
        return this.getBusinessNetworkConnection().getTransactionRegistry(relationship.transactionType)
            .then((transactionRegistry) => {
                return transactionRegistry.get(identifier);
            })
            .then((resolvedTransaction) => {
                return resolvedTransaction;
            });
    }

    getSavedBusinessNetworkName(identity: string): string {
        let key = `currentBusinessNetwork:${identity}`;
        return this.localStorageService.get<string>(key);
    }

    setSavedBusinessNetworkName(identity: string): void {
        let key = `currentBusinessNetwork:${identity}`;
        this.localStorageService.set(key, this.getBusinessNetwork().getName());
    }
}
