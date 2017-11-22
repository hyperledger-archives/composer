/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */

import { TestBed, inject } from '@angular/core/testing';
import { ConfigService } from '../config.service';
import { BusinessNetworkCardStoreService } from './businessnetworkcardstore.service';
import { PlaygroundBusinessNetworkCardStore } from './playgroundbusinessnetworkcardstore';
import * as sinon from 'sinon';

import { BrowserBusinessNetworkCardStore } from './browserbusinessnetworkcardstore';

describe('BusinessNetworkCardStoreService', () => {

    let mockConfigService;

    beforeEach(() => {
        mockConfigService = sinon.createStubInstance(ConfigService);
        TestBed.configureTestingModule({
            providers: [
                BusinessNetworkCardStoreService,
                {provide: ConfigService, useValue: mockConfigService}
            ]
        });
    });

    describe('getBusinessNetworkCardStore', () => {
        it('should create a new file system business network card store',
            inject([BusinessNetworkCardStoreService],
                (businessNetworkCardStoreService) => {
                    businessNetworkCardStoreService.should.be.ok;
                    mockConfigService.isWebOnly.returns(true);
                    const cardStore = businessNetworkCardStoreService.getBusinessNetworkCardStore();
                    cardStore.should.be.an.instanceOf(BrowserBusinessNetworkCardStore);
                }
            ));

        it('should create a new playground business network card store',
            inject([BusinessNetworkCardStoreService],
                (businessNetworkCardStoreService) => {
                    businessNetworkCardStoreService.should.be.ok;
                    const cardStore = businessNetworkCardStoreService.getBusinessNetworkCardStore();
                    cardStore.should.be.an.instanceOf(PlaygroundBusinessNetworkCardStore);
                }
            ));

        it('should not create more than one business network card store',
            inject([BusinessNetworkCardStoreService],
                (businessNetworkCardStoreService) => {
                    businessNetworkCardStoreService.should.be.ok;
                    const cardStore1 = businessNetworkCardStoreService.getBusinessNetworkCardStore();
                    const cardStore2 = businessNetworkCardStoreService.getBusinessNetworkCardStore();
                    cardStore1.should.equal(cardStore2);
                }
            ));
    });
});
