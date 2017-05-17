import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs/Rx';
import { ConnectionProfileService } from './connectionprofile.service';
import { IdentityService } from './identity.service';
import { AlertService } from './alert.service';
import { AdminConnection } from 'composer-admin';
import { ConnectionProfileManager, Logger, BusinessNetworkDefinition } from 'composer-common';
import ProxyConnectionManager = require('composer-connector-proxy');
import WebConnectionManager = require('composer-connector-web');

@Injectable()
export class AdminService {

    public connectionProfileChanged$: Subject<string> = new BehaviorSubject<string>(null);

    private adminConnection: AdminConnection = null;
    private isConnected: boolean = false;
    private connectingPromise: Promise<any> = null;
    private initialDeploy: boolean = false;

    private madeItToConnect = false;
    private connectionProfile;
    private userID;
    private userSecret;
    private deployed = false;

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

    getAdminConnection() {
        if (!this.adminConnection) {
            this.adminConnection = new AdminConnection();
        }

        return this.adminConnection;
    }

    public ensureConnected(force: boolean = false): Promise<any> {
        if (this.isConnected && !force) {
            return Promise.resolve();
        } else if (this.connectingPromise) {
            return this.connectingPromise;
        }

        console.log('Establishing admin connection ...');
        this.connectingPromise = Promise.resolve()
        .then(() => {
            return this.connect();
        })
        .catch((error) => {
            // If we didn't make it to connect, then the business network is probably not deployed.
            // Try again with a admin connection with no business network specified so we can deploy it.
            if (!this.madeItToConnect) {
                throw error;
            }

            return this.connectWithOutID();
        })
        .then(() => {
            console.log('Connected');
            this.isConnected = true;
            this.connectingPromise = null;
        })
        .catch((error) => {
            this.alertService.errorStatus$.next(`Failed to connect: ${error}`);
            this.isConnected = false;
            this.connectingPromise = null;
            throw error;
        });
        return this.connectingPromise;
    }

    connect(): Promise<any> {
        this.connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
        console.log('Connecting to connection profile (w/ business network ID)', this.connectionProfile);
        return this.identityService.getUserID()
        .then((userId) => {
            this.userID = userId;
            return this.identityService.getUserSecret();
        })
        .then((userSecret) => {
            this.userSecret = userSecret;
            this.madeItToConnect = true;
            return this.getAdminConnection().connect(this.connectionProfile, this.userID, this.userSecret, 'org.acme.biznet');
        });
    }

    connectWithOutID(): Promise<any> {
        console.log('Connecting to connection profile (w/o business network ID)', this.connectionProfile);
        return this.getAdminConnection().connect(this.connectionProfile, this.userID, this.userSecret)
        .then(() => {
            return this.getAdminConnection().list();
        })
        .then((businessNetworks) => {
            console.log('Got business networks', businessNetworks);
            this.deployed = businessNetworks.some((businessNetwork) => {
                return businessNetwork === 'org.acme.biznet';
            });
            if (!this.deployed) {
                this.alertService.busyStatus$.next({title: 'Deploying business network', text : 'deploying sample'});
                console.log('Deploying sample business network');
                let businessNetworkDefinition = this.generateDefaultBusinessNetwork();
                return this.getAdminConnection().deploy(businessNetworkDefinition)
                .then(() => {
                    this.initialDeploy = true;
                });
            }
        })
        .then(() => {
            return this.getAdminConnection().disconnect();
        })
        .then(() => {
            console.log('Connecting to connection profile (w/ business network ID)', this.connectionProfile);
            return this.getAdminConnection().connect(this.connectionProfile, this.userID, this.userSecret, 'org.acme.biznet');
        });
    }

    public deploy(businessNetworkDefinition: BusinessNetworkDefinition): Promise<any> {
        return this.ensureConnected()
        .then(() => {
            return this.adminConnection.deploy(businessNetworkDefinition);
        });
    }

    public update(businessNetworkDefinition: BusinessNetworkDefinition): Promise<any> {
        return this.ensureConnected()
        .then(() => {
            return this.adminConnection.update(businessNetworkDefinition);
        });
    }

    generateDefaultBusinessNetwork(): BusinessNetworkDefinition {
        let businessNetworkDefinition = new BusinessNetworkDefinition('org.acme.biznet@0.0.1', 'Acme Business Network');
        return businessNetworkDefinition;
    }

    isInitialDeploy(): boolean {
        let result = this.initialDeploy;
        this.initialDeploy = false;
        return result;
    }
}
