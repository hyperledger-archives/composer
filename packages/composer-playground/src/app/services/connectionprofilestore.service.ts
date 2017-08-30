import { Injectable } from '@angular/core';

import { ConfigService } from './config.service';

import { ConnectionProfileStore, FSConnectionProfileStore } from 'composer-common';
/* tslint:disable:no-var-requires */
const ProxyConnectionProfileStore = require('composer-connector-proxy').ProxyConnectionProfileStore;
const fs = require('fs');

@Injectable()
export class ConnectionProfileStoreService {

    private connectionProfileStore: ConnectionProfileStore = null;

    constructor(private configService: ConfigService) {
        // The proxy connection manager defaults to http://localhost:15699,
        // but that is not suitable for anything other than development.
        if (ENV && ENV !== 'development') {
            ProxyConnectionProfileStore.setConnectorServerURL(window.location.origin);
        }
    }

    public getConnectionProfileStore(): ConnectionProfileStore {
        if (!this.connectionProfileStore) {
            if (this.configService.isWebOnly()) {
                this.connectionProfileStore = new FSConnectionProfileStore(fs);
            } else {
                this.connectionProfileStore = new ProxyConnectionProfileStore();
            }
        }
        return this.connectionProfileStore;
    }
}
