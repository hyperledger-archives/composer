import { Injectable } from '@angular/core';

import { AlertService } from '../basic-modals/alert.service';
import { BusinessNetworkCardStoreService } from './cardStores/businessnetworkcardstore.service';

import { AdminConnection } from 'composer-admin';
import { ConnectionProfileManager, Logger, BusinessNetworkDefinition, IdCard } from 'composer-common';

import ProxyConnectionManager = require('composer-connector-proxy');
import WebConnectionManager = require('composer-connector-web');

@Injectable()
export class AdminService {
    private adminConnection: AdminConnection = null;

    private isConnected: boolean = false;
    private connectingPromise: Promise<any> = null;

    constructor(private alertService: AlertService,
                private businessNetworkCardStoreService: BusinessNetworkCardStoreService) {
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
                cardStore: this.businessNetworkCardStoreService.getBusinessNetworkCardStore()
            });
        }

        return this.adminConnection;
    }

    connect(cardName, card, force = false): Promise<void> {
        if (this.isConnected && !force) {
            return Promise.resolve();
        } else if (this.connectingPromise) {
            return this.connectingPromise;
        }

        console.log('Establishing admin connection ...');

        this.alertService.busyStatus$.next({
            title: card.getBusinessNetworkName() ? 'Connecting to Business Network ' + card.getBusinessNetworkName() : 'Connecting without a business network',
            text: 'using connection profile ' + card.getConnectionProfile().name
        });

        this.connectingPromise = this.getAdminConnection().connect(cardName)
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

    public undeploy(businessNetworkDefinitionName: string): Promise<void> {
        return this.getAdminConnection().undeploy(businessNetworkDefinitionName);
    }

    public importCard(cardName: string, card: IdCard): Promise<void> {
        return this.getAdminConnection().importCard(cardName, card);
    }

    public exportCard(cardName: string): Promise<IdCard> {
        return this.getAdminConnection().exportCard(cardName);
    }

    public getAllCards(): Promise<Map<string, IdCard>> {
        return this.getAdminConnection().getAllCards();
    }

    public deleteCard(cardName): Promise<void> {
        return this.getAdminConnection().deleteCard(cardName);
    }

    generateDefaultBusinessNetwork(name: string, description: string): BusinessNetworkDefinition {
        let businessNetworkDefinition = new BusinessNetworkDefinition(name + '@0.0.1', description);
        return businessNetworkDefinition;
    }
}
