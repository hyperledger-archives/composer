/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */

import { TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { ConfigService } from '../config.service';
import { ConnectionProfileStoreService } from './connectionprofilestore.service';
import { PlaygroundConnectionProfileStore } from './playgroundconnectionprofilestore';
import * as sinon from 'sinon';

import { BrowserConnectionProfileStore } from './browserconnectionprofilestore';

describe('ConnectionProfileStoreService', () => {

    let mockConfigService;

    beforeEach(() => {
        mockConfigService = sinon.createStubInstance(ConfigService);
        TestBed.configureTestingModule({
            providers: [
                ConnectionProfileStoreService,
                {provide: ConfigService, useValue: mockConfigService}
            ]
        });
    });

    describe('getConnectionProfileStore', () => {
        it('should create a new file system connection profile store',
            inject([ConnectionProfileStoreService],
                (connectionProfileStoreService) => {
                    connectionProfileStoreService.should.be.ok;
                    mockConfigService.isWebOnly.returns(true);
                    const connectionProfileStore = connectionProfileStoreService.getConnectionProfileStore();
                    connectionProfileStore.should.be.an.instanceOf(BrowserConnectionProfileStore);
                }
            ));

        it('should create a new playground connection profile store',
            inject([ConnectionProfileStoreService],
                (connectionProfileStoreService) => {
                    connectionProfileStoreService.should.be.ok;
                    const connectionProfileStore = connectionProfileStoreService.getConnectionProfileStore();
                    connectionProfileStore.should.be.an.instanceOf(PlaygroundConnectionProfileStore);
                }
            ));

        it('should not create more than one connection profile store',
            inject([ConnectionProfileStoreService],
                (connectionProfileStoreService) => {
                    connectionProfileStoreService.should.be.ok;
                    const connectionProfileStore1 = connectionProfileStoreService.getConnectionProfileStore();
                    const connectionProfileStore2 = connectionProfileStoreService.getConnectionProfileStore();
                    connectionProfileStore1.should.equal(connectionProfileStore2);
                }
            ));
    });
});
