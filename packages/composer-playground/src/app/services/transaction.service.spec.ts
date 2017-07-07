/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, inject } from '@angular/core/testing';
import { TransactionService } from './transaction.service';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();
let expect = chai.expect;

describe('TransactionService', () => {
    let sandbox;

    beforeEach(() => {

        sandbox = sinon.sandbox.create();

        TestBed.configureTestingModule({
            providers: [TransactionService]
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#reset', () => {
        it('should change the values of lastTransaction and events', inject([TransactionService], (service: TransactionService) => {
            service.reset('transaction', 'events');
            service.lastTransaction.should.equal('transaction');
            service.events.should.equal('events');
        }));

        it('should reset lastTransaction and events', inject([TransactionService], (service: TransactionService) => {
            service.reset(null, null);
            expect(service.lastTransaction).to.be.null;
            service.events.should.deep.equal([]);
        }));
    });
});
