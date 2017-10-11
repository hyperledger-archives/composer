import { Injectable } from '@angular/core';

import { ConfigService } from '../config.service';

import { ConnectionProfileStore } from 'composer-common';
import { PlaygroundConnectionProfileStore } from './playgroundconnectionprofilestore';
import { BrowserConnectionProfileStore } from './browserconnectionprofilestore';

@Injectable()
export class ConnectionProfileStoreService {

    private connectionProfileStore: ConnectionProfileStore = null;

    constructor(private configService: ConfigService) {

    }

    public getConnectionProfileStore(): ConnectionProfileStore {
        if (!this.connectionProfileStore) {
            if (this.configService.isWebOnly()) {
                this.connectionProfileStore = new BrowserConnectionProfileStore();
            } else {
                this.connectionProfileStore = new PlaygroundConnectionProfileStore();
            }
        }
        return this.connectionProfileStore;
    }
}
