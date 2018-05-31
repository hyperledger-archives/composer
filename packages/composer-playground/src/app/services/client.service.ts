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

import { AdminService } from './admin.service';
import { IdentityCardService } from './identity-card.service';
import { AlertService } from '../basic-modals/alert.service';
import { BusinessNetworkCardStoreService } from './cardStores/businessnetworkcardstore.service';

import { BusinessNetworkConnection } from 'composer-client';
import { BusinessNetworkDefinition, TransactionDeclaration } from 'composer-common';

@Injectable()
export class ClientService {
    private businessNetworkConnection: BusinessNetworkConnection = null;
    private isConnected: boolean = false;
    private connectingPromise: Promise<any> = null;

    private currentBusinessNetwork: BusinessNetworkDefinition = null;
    private deployedBusinessNetworkVersion: string = null;

    constructor(private adminService: AdminService,
                private identityCardService: IdentityCardService,
                private alertService: AlertService,
                private businessNetworkCardStoreService: BusinessNetworkCardStoreService) {
    }

    // horrible hack for tests
    createBusinessNetwork(identifier, description, packageJson, readme) {
        return new BusinessNetworkDefinition(identifier, description, packageJson, readme);
    }

    getBusinessNetworkConnection(): BusinessNetworkConnection {
        if (!this.businessNetworkConnection) {
            this.businessNetworkConnection = new BusinessNetworkConnection({
                cardStore: this.businessNetworkCardStoreService.getBusinessNetworkCardStore()
            });
        }
        return this.businessNetworkConnection;
    }

    getBusinessNetwork(): BusinessNetworkDefinition {
        if (!this.currentBusinessNetwork) {
            this.currentBusinessNetwork = this.getBusinessNetworkConnection().getBusinessNetwork();
            this.deployedBusinessNetworkVersion = this.currentBusinessNetwork.getMetadata().getVersion();
        }

        return this.currentBusinessNetwork;
    }

    getDeployedBusinessNetworkVersion(): string {
        if (!this.deployedBusinessNetworkVersion) {
            this.deployedBusinessNetworkVersion = this.getBusinessNetwork().getMetadata().getVersion();
        }
        return this.deployedBusinessNetworkVersion;
    }

    ensureConnected(force: boolean = false): Promise<any> {
        if (this.isConnected && !force) {
            return Promise.resolve();
        } else if (this.connectingPromise) {
            return this.connectingPromise;
        }

        let cardName = this.identityCardService.getCurrentCardRef();
        let card = this.identityCardService.getCurrentIdentityCard();

        const connectionProfileName = card.getConnectionProfile()['x-type'] === 'web' ? 'web' : card.getConnectionProfile().name;
        this.alertService.busyStatus$.next({
            title: 'Establishing connection',
            text: 'Using the connection profile ' + connectionProfileName,
            force: true
        });

        this.connectingPromise = this.adminService.connect(cardName, card, force)
            .then(() => {
                return this.refresh();
            })
            .then(() => {
                this.isConnected = true;
                this.connectingPromise = null;
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

    refresh(): Promise<any> {
        this.currentBusinessNetwork = null;
        this.deployedBusinessNetworkVersion = null;
        let cardRef = this.identityCardService.getCurrentCardRef();
        let card = this.identityCardService.getCurrentIdentityCard();

        const connectionProfileName = card.getConnectionProfile()['x-type'] === 'web' ? 'web' : card.getConnectionProfile().name;

        this.alertService.busyStatus$.next({
            title: 'Refreshing Connection',
            text: 'refreshing the connection to ' + connectionProfileName,
            force: true
        });

        return this.getBusinessNetworkConnection().disconnect()
            .then(() => {
                return this.getBusinessNetworkConnection().connect(cardRef);
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
        let connectionProfile = this.identityCardService.getCurrentIdentityCard().getConnectionProfile();

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
}
