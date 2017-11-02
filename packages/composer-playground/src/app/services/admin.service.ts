import { Injectable } from '@angular/core';

import { IdentityService } from './identity.service';
import { AlertService } from '../basic-modals/alert.service';
import { ConnectionProfileStoreService } from './connectionProfileStores/connectionprofilestore.service';

import { AdminConnection } from 'composer-admin';
import { ConnectionProfileManager, Logger, BusinessNetworkDefinition } from 'composer-common';

import ProxyConnectionManager = require('composer-connector-proxy');
import WebConnectionManager = require('composer-connector-web');

@Injectable()
export class AdminService {
    private adminConnection: AdminConnection = null;

    private isConnected: boolean = false;
    private connectingPromise: Promise<any> = null;

    constructor(private alertService: AlertService,
                private connectionProfileStoreService: ConnectionProfileStoreService,
                private identityService: IdentityService) {
        Logger.setFunctionalLogger({
            // tslint:disable-next-line:no-empty
            log: () => {
            }
        });
        // The proxy connection manager defaults to http://localhost:15699,
        // but that is not suitable for anything other than development.
        if (ENV && ENV !== 'development') {
            ProxyConnectionManager.setConnectorServerURL(window.location.origin);
        }

        ConnectionProfileManager.registerConnectionManager('hlf', ProxyConnectionManager);
        ConnectionProfileManager.registerConnectionManager('hlfv1', ProxyConnectionManager);
        ConnectionProfileManager.registerConnectionManager('web', WebConnectionManager);
    }

    getAdminConnection(): AdminConnection {
        if (!this.adminConnection) {
            this.adminConnection = new AdminConnection({
                connectionProfileStore: this.connectionProfileStoreService.getConnectionProfileStore()
            });
        }

        return this.adminConnection;
    }

    connect(businessNetworkName: string, force = false): Promise<void> {
        if (this.isConnected && !force) {
            return Promise.resolve();
        } else if (this.connectingPromise) {
            return this.connectingPromise;
        }

        console.log('Establishing admin connection ...');

        let connectionProfile = this.identityService.getCurrentConnectionProfile();
        let connectionProfileRef = this.identityService.getCurrentQualifiedProfileName();
        let enrollmentCredentials = this.identityService.getCurrentEnrollmentCredentials();
        const enrollmentSecret = enrollmentCredentials ? enrollmentCredentials.secret : null;
        const userName = this.identityService.getCurrentUserName();

        this.alertService.busyStatus$.next({
            title: businessNetworkName ? 'Connecting to Business Network ' + businessNetworkName : 'Connecting without a business network',
            text: 'using connection profile ' + connectionProfile.name
        });

        if (businessNetworkName) {
            console.log('Connecting to business network %s with connection profile %s with id %s', businessNetworkName, connectionProfileRef, userName);
        } else {
            console.log('Connecting with connection profile %s with id %s', connectionProfileRef, userName);
        }

        this.connectingPromise = this.getAdminConnection().connectWithDetails(connectionProfileRef, userName, enrollmentSecret, businessNetworkName)
            .then(() => {
                this.isConnected = true;
                this.connectingPromise = null;
                this.alertService.busyStatus$.next(null);
            })
            .catch((error) => {
                this.connectingPromise = null;
                this.alertService.busyStatus$.next(null);
                throw error;
            });

        return this.connectingPromise;
    }

    connectWithoutNetwork(force = false): Promise<void> {
        return this.connect(null, force);
    }

    public createNewBusinessNetwork(name: string, description: string): Promise<boolean | void> {
        this.alertService.busyStatus$.next({
            title: 'Checking Business Network',
            text: 'checking if ' + name + ' exists',
            force: true
        });

        let connectionProfile = this.identityService.getCurrentConnectionProfile();
        let connectionProfileRef = this.identityService.getCurrentQualifiedProfileName();
        let enrollmentCredentials = this.identityService.getCurrentEnrollmentCredentials();
        const enrollmentSecret = enrollmentCredentials ? enrollmentCredentials.secret : null;
        const userName = this.identityService.getCurrentUserName();

        return this.list()
            .then((businessNetworks) => {
                // check if business network already exists
                let deployed = businessNetworks.some((businessNetwork) => {
                    return businessNetwork === name;
                });
                if (deployed) {
                    this.alertService.busyStatus$.next(null);
                    throw Error('businessNetwork with name ' + name + ' already exists');
                }

                this.alertService.busyStatus$.next({
                    title: 'Creating Business Network',
                    text: 'creating business network ' + name,
                    force: true
                });

                return this.getAdminConnection().connectWithDetails(connectionProfileRef, userName, enrollmentSecret);
            })
            .then(() => {
                let businessNetworkDefinition = this.generateDefaultBusinessNetwork(name, description);
                return this.getAdminConnection().deploy(businessNetworkDefinition);
            })
            .then(() => {
                return this.disconnect();
            })
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Connecting to Business Network ' + name,
                    text: 'using connection profile ' + connectionProfile.name,
                    force: true
                });

                console.log('Connecting to business network %s with connection profile %s with id %s', name, connectionProfileRef, userName);
                return this.getAdminConnection().connectWithDetails(connectionProfileRef, userName, enrollmentSecret, name);
            })
            .then(() => {
                return true;
            })
            .catch((error) => {
                this.alertService.busyStatus$.next(null);
                if (error.message.startsWith('businessNetwork with name')) {
                    throw error;
                } else {
                    this.alertService.errorStatus$.next(error);
                }
            });
    }

    public list(): Promise<string[]> {
        let result;

        return this.connectWithoutNetwork(true)
            .then(() => {
                return this.getAdminConnection().list();
            })
            .then((businessNetworks) => {
                result = businessNetworks;
                return this.disconnect();
            })
            .then(() => {
                return result;
            });
    }

    public disconnect(): Promise<any> {
        return this.getAdminConnection().disconnect().then(() => {
            this.isConnected = false;
        });
    }

    public reset(businessNetworkDefinitionName): Promise<any> {
        return this.getAdminConnection().reset(businessNetworkDefinitionName);
    }

    public deploy(businessNetworkDefinition: BusinessNetworkDefinition): Promise<void> {
        return this.getAdminConnection().deploy(businessNetworkDefinition);
    }

    public update(businessNetworkDefinition: BusinessNetworkDefinition): Promise<void> {
        return this.getAdminConnection().update(businessNetworkDefinition);
    }

    public install(businessNetworkDefinitionName: string): Promise<void> {
        return this.getAdminConnection().install(businessNetworkDefinitionName);
    }

    public start(businessNetworkDefinition: BusinessNetworkDefinition, startOptions?: object): Promise<void> {
        // Cast to <any> as TypeScript does not know about default parameters :-(
        return (<any> this.getAdminConnection()).start(businessNetworkDefinition, startOptions);
    }

    public importIdentity(connectionProfileName: string, id: string, certificate: string, privateKey: string): Promise<void> {
        return this.getAdminConnection().importIdentity(connectionProfileName, id, certificate, privateKey);
    }

    public exportIdentity(connectionProfileName: string, id: string): Promise<any> {
        return this.getAdminConnection().exportIdentity(connectionProfileName, id);
    }

    generateDefaultBusinessNetwork(name: string, description: string): BusinessNetworkDefinition {
        let businessNetworkDefinition = new BusinessNetworkDefinition(name + '@0.0.1', description);
        return businessNetworkDefinition;
    }
}
