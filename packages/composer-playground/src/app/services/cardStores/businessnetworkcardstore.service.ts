import { Injectable } from '@angular/core';

import { ConfigService } from '../config.service';

import { BusinessNetworkCardStore } from 'composer-common';
import { PlaygroundBusinessNetworkCardStore } from './playgroundbusinessnetworkcardstore';
import { BrowserBusinessNetworkCardStore } from './browserbusinessnetworkcardstore';

@Injectable()
export class BusinessNetworkCardStoreService {

    private businessNetworkCardStore: BusinessNetworkCardStore = null;

    constructor(private configService: ConfigService) {

    }

    public getBusinessNetworkCardStore(): BusinessNetworkCardStore {
        if (!this.businessNetworkCardStore) {
            if (this.configService.isWebOnly()) {
                this.businessNetworkCardStore = new BrowserBusinessNetworkCardStore();
            } else {
                this.businessNetworkCardStore = new PlaygroundBusinessNetworkCardStore();
            }
        }
        return this.businessNetworkCardStore;
    }
}
