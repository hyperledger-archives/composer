import { Injectable } from '@angular/core';

import { ConnectionProfileStore } from 'composer-common';
/* tslint:disable:no-var-requires */
const ProxyConnectionProfileStore = require('composer-connector-proxy').ProxyConnectionProfileStore;

@Injectable()
export class ConnectionProfileStoreService {

    private connectionProfileStore: ConnectionProfileStore = null;

    constructor() {
        // The proxy connection manager defaults to http://localhost:15699,
        // but that is not suitable for anything other than development.
        if (ENV && ENV !== 'development') {
            ProxyConnectionProfileStore.setConnectorServerURL(window.location.origin);
        }
    }

    public getConnectionProfileStore(): ConnectionProfileStore {
        if (!this.connectionProfileStore) {
            this.connectionProfileStore = new ProxyConnectionProfileStore();
        }
        return this.connectionProfileStore;
    }
}
