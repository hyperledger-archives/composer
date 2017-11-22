/* tslint:disable:no-var-requires */
import { BrowserBusinessNetworkCardStore } from './browserbusinessnetworkcardstore';
import { IdCard } from 'composer-common';

import * as chai from 'chai';

let should = chai.should();

describe('BrowserBusinessNetworkCardStore', () => {

    let businessNetworkCardStore: BrowserBusinessNetworkCardStore = null;

    let idCardOne;
    let idCardTwo;

    beforeEach((done) => {
        window['localStorage'].clear();
        businessNetworkCardStore = new BrowserBusinessNetworkCardStore();

        let promises = [];

        idCardOne = new IdCard({userName: 'bob'}, {name: 'profileOne'});
        idCardTwo = new IdCard({userName: 'fred'}, {name: 'profileTwo'});
        promises.push(businessNetworkCardStore.put('bob', idCardOne));
        promises.push(businessNetworkCardStore.put('fred', idCardTwo));

        return Promise.all(promises).then(() => {
            done();
        });
    });

    afterEach(() => {
        window['localStorage'].clear();
    });

    describe('#get', () => {
        it('should get from the browser business network card store', (done) => {
            return businessNetworkCardStore.get('bob').then((result) => {
                result.should.deep.equal(idCardOne);
                done();
            });
        });
    });

    describe('#put', () => {
        it('should save cards to the business network card store', (done) => {
            let idCardThree = new IdCard({userName: 'banana'}, {name: 'profileThree'});
            return businessNetworkCardStore.put('banana', idCardThree)
                .then(() => {
                    return businessNetworkCardStore.get('banana');
                })
                .then((result) => {
                    result.should.deep.equal(idCardThree);
                    done();
                });
        });

    });

    describe('has', () => {
        it('should return true if the card exists', (done) => {
            let idCardThree = new IdCard({userName: 'banana'}, {name: 'profileThree'});
            return businessNetworkCardStore.put('banana', idCardThree)
                .then(() => {
                    return businessNetworkCardStore.has('banana');
                })
                .then((result) => {
                    result.should.equal(true);
                    done();
                });
        });

        it('should return false if the card does not exists', (done) => {
            return businessNetworkCardStore.has('banana')
                .then((result) => {
                    result.should.equal(false);
                    done();
                });
        });
    });

    describe('#getAll', () => {
        it('should get all business network cards', (done) => {
            window['localStorage'].setItem('not-card', JSON.stringify({name: 'not-card'}));

            return businessNetworkCardStore.getAll().then((result) => {
                result.size.should.equal(2);

                let cards = Array.from(result.entries());

                cards[0].should.deep.equal(['bob', idCardOne]);
                cards[1].should.deep.equal(['fred', idCardTwo]);
                done();
            });
        });
    });

    describe('#delete', () => {
        it('should ignore errors for cards that do not exist', (done) => {
            return businessNetworkCardStore.delete('no-profile')
                .then(() => {
                    done();
                })
                .catch(() => {
                    throw new Error('should not get here');
                });
        });

        it('should delete web cards from the browser business network store', (done) => {
            return businessNetworkCardStore.delete('bob')
                .then(() => {
                    return businessNetworkCardStore.get('bob');
                })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.equal('does not exist bob');
                    done();
                });
        });
    });
})
;
