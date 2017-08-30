import { Injectable } from '@angular/core';

import { ConfigService } from './config.service';

import { ConnectionProfileStore, FSConnectionProfileStore } from 'composer-common';
import { PlaygroundConnectionProfileStore } from './playgroundconnectionprofilestore';
/* tslint:disable:no-var-requires */
const fs = require('fs');

@Injectable()
export class ConnectionProfileStoreService {

    private connectionProfileStore: ConnectionProfileStore = null;

    constructor(private configService: ConfigService) {

    }

    public getConnectionProfileStore(): ConnectionProfileStore {
        if (!this.connectionProfileStore) {
            if (this.configService.isWebOnly()) {
                this.connectionProfileStore = new FSConnectionProfileStore(fs);
            } else {
                this.connectionProfileStore = new PlaygroundConnectionProfileStore();
            }
        }
        return this.connectionProfileStore;
    }
}
