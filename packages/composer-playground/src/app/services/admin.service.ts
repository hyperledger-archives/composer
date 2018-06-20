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

import { AlertService } from '../basic-modals/alert.service';
import { BusinessNetworkCardStoreService } from './cardStores/businessnetworkcardstore.service';

import { AdminConnection } from 'composer-admin';
import { BusinessNetworkDefinition, ConnectionProfileManager, IdCard } from 'composer-common';
import ProxyConnectionManager = require('composer-connector-proxy');
import WebConnectionManager = require('composer-connector-web');

@Injectable()
export class AdminService {
    private adminConnection: AdminConnection = null;

    private isConnected: boolean = false;
    private connectingPromise: Promise<any> = null;

    constructor(private alertService: AlertService,
                private businessNetworkCardStoreService: BusinessNetworkCardStoreService) {
        // The proxy connection manager defaults to http://localhost:15699,
        // but that is not suitable for anything other than development.
        if (ENV && ENV !== 'development') {
            ProxyConnectionManager.setConnectorServerURL(window.location.origin);
        }
        // closing and opening the socket owned by the proxyconnectionmanager causes
        // slowdown in the browser and also causes hangs when switching between the
        // different registered connection managers.
        ProxyConnectionManager.setConnectorStrategy({closeOnDisconnect: false});
        ConnectionProfileManager.registerConnectionManager('proxy', ProxyConnectionManager);
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

        const connectionProfileName = card.getConnectionProfile()['x-type'] === 'web' ? 'web' : card.getConnectionProfile().name;
        this.alertService.busyStatus$.next({
            title: card.getBusinessNetworkName() ? 'Connecting to Business Network ' + card.getBusinessNetworkName() : 'Connecting without a business network',
            text: 'using connection profile ' + connectionProfileName,
            force: true
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

    public upgrade(businessNetworkName: String, businessNetworkVersion: String): Promise<void> {
        return this.getAdminConnection().upgrade(businessNetworkName, businessNetworkVersion);
    }

    public install(businessNetworkDefinition: BusinessNetworkDefinition): Promise<void> {
        return this.getAdminConnection().install(businessNetworkDefinition);
    }

    public start(businessNetworkName: String, businessNetworkVersion: String, startOptions?: object): Promise<Map<string, IdCard>> {
        return this.getAdminConnection().start(businessNetworkName, businessNetworkVersion, startOptions);
    }

    public undeploy(businessNetworkName: String): Promise<void> {
        return this.getAdminConnection().undeploy(businessNetworkName);
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

    public hasCard(cardName): Promise<boolean> {
        return this.getAdminConnection().hasCard(cardName);
    }

    generateDefaultBusinessNetwork(name: string, description: string): BusinessNetworkDefinition {
        let businessNetworkDefinition = new BusinessNetworkDefinition(name + '@0.0.1', description);
        return businessNetworkDefinition;
    }
}
