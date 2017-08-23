/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */

import { TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { ConnectionProfileStoreService } from './connectionprofilestore.service';
const ProxyConnectionProfileStore = require('composer-connector-proxy').ProxyConnectionProfileStore;
import * as sinon from 'sinon';
import { expect } from 'chai';

describe('ConnectionProfileStoreService', () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ConnectionProfileStoreService]
        });
    });

    describe('getConnectionProfileStore', () => {
        it('should create a new proxy connection profile store',
            inject([ConnectionProfileStoreService],
                (connectionProfileStoreService) => {
                    connectionProfileStoreService.should.be.ok;
                    const connectionProfileStore = connectionProfileStoreService.getConnectionProfileStore();
                    connectionProfileStore.should.be.an.instanceOf(ProxyConnectionProfileStore);
                }
            ));

        it('should not create more than one proxy connection profile store',
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
