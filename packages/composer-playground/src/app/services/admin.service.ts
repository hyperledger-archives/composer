import { Injectable } from '@angular/core';
import { ConnectionProfileService } from './connectionprofile.service';
import { IdentityService } from './identity.service';
import { AlertService } from '../basic-modals/alert.service';
import { AdminConnection } from 'composer-admin';
import { ConnectionProfileManager, Logger, BusinessNetworkDefinition } from 'composer-common';
import ProxyConnectionManager = require('composer-connector-proxy');
import WebConnectionManager = require('composer-connector-web');

@Injectable()
export class AdminService {
    private adminConnection: AdminConnection = null;

    private isConnected: boolean = false;
    private connectingPromise: Promise<any> = null;

    private initialDeploy: boolean = false;

    constructor(private connectionProfileService: ConnectionProfileService,
                private identityService: IdentityService,
                private alertService: AlertService) {
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
            this.adminConnection = new AdminConnection();
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

        let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();

        this.alertService.busyStatus$.next({
            title: 'Connecting to Business Network ' + businessNetworkName,
            text: 'using connection profile ' + connectionProfile
        });

        let userID;
        this.connectingPromise = this.identityService.getUserID()
            .then((userId) => {
                userID = userId;
                return this.identityService.getUserSecret();
            })
            .then((userSecret) => {
                console.log('Connecting to business network %s with connection profile %s with id %s', businessNetworkName, connectionProfile, userID);
                return this.getAdminConnection().connect(connectionProfile, userID, userSecret, businessNetworkName);
            })
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

    connectWithoutNetwork(force = false) {
        if (this.isConnected && !force) {
            return Promise.resolve();
        } else if (this.connectingPromise) {
            return this.connectingPromise;
        }

        console.log('Establishing admin connection ...');

        let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();

        this.alertService.busyStatus$.next({
            title: 'Connecting without a business network',
            text: 'using connection profile ' + connectionProfile
        });

        let userID;
        this.connectingPromise = this.identityService.getUserID()
            .then((userId) => {
                userID = userId;
                return this.identityService.getUserSecret();
            })
            .then((userSecret) => {
                console.log('Connecting with connection profile %s with id %s', connectionProfile, userID);
                return this.getAdminConnection().connect(connectionProfile, userID, userSecret);
            })
            .then(() => {
                this.isConnected = true;
                this.connectingPromise = null;
                this.alertService.busyStatus$.next(null);
            })
            .catch((error) => {
                this.connectingPromise = null;
                this.alertService.busyStatus$.next(null);
                this.alertService.errorStatus$.next(error);
            });

        return this.connectingPromise;

    }

    public createNewBusinessNetwork(name: string, description: string): Promise<void> {
        this.alertService.busyStatus$.next({
            title: 'Checking Business Network',
            text: 'checking if ' + name + ' exists'
        });

        let userSecret;
        let connectionProfile;
        let userId;
        return this.list()
            .then((businessNetworks) => {
                // check if business network already exists
                let deployed = businessNetworks.some((businessNetwork) => {
                    return businessNetwork === name;
                });
                if (deployed) {
                    this.initialDeploy = false;
                    this.alertService.busyStatus$.next(null);
                    throw Error('businessNetwork with name ' + name + ' already exists');
                }

                this.alertService.busyStatus$.next({
                    title: 'Creating Business Network',
                    text: 'creating business network ' + name
                });
                connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
                return this.identityService.getUserID();
            })
            .then((userID) => {
                userId = userID;
                return this.identityService.getUserSecret();
            })
            .then((secret) => {
                userSecret = secret;
                return this.getAdminConnection().connect(connectionProfile, userId, userSecret);
            })
            .then(() => {
                let businessNetworkDefinition = this.generateDefaultBusinessNetwork(name, description);
                return this.getAdminConnection().deploy(businessNetworkDefinition);
            })
            .then(() => {
                this.initialDeploy = true;
                return this.getAdminConnection().disconnect();
            })
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Connecting to Business Network ' + name,
                    text: 'using connection profile, connectionProfile'
                });

                console.log('Connecting to business network %s with connection profile %s with id %s', name, connectionProfile, userId);
                return this.getAdminConnection().connect(connectionProfile, userId, userSecret, name);
            })
            .then(() => {
                this.alertService.busyStatus$.next(null);
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

    public  list(): Promise<string[]> {
        let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
        let userId;
        let userSecret;
        return this.identityService.getUserID()
            .then((userID) => {
                userId = userID;
                return this.identityService.getUserSecret();
            })
            .then((secret) => {
                userSecret = secret;
                return this.getAdminConnection().connect(connectionProfile, userId, userSecret);
            })
            .then(() => {
                return this.getAdminConnection().list();
            })
            .then((businessNetworks) => {
                this.disconnect();
                return businessNetworks;
            });
    }

    public disconnect(): void {
        this.isConnected = false;
        this.getAdminConnection().disconnect();
    }

    public deploy(businessNetworkDefinition: BusinessNetworkDefinition): Promise<void> {
        return this.connect(businessNetworkDefinition.getName()).then(() => {
            return this.getAdminConnection().deploy(businessNetworkDefinition);
        });

    }

    public update(businessNetworkDefinition: BusinessNetworkDefinition): Promise<void> {
        return this.getAdminConnection().update(businessNetworkDefinition);
    }

    generateDefaultBusinessNetwork(name: string, description: string): BusinessNetworkDefinition {
        let businessNetworkDefinition = new BusinessNetworkDefinition(name + '@0.0.1', description);
        return businessNetworkDefinition;
    }

    isInitialDeploy(): boolean {
        let result = this.initialDeploy;
        this.initialDeploy = false;
        return result;
    }
}
