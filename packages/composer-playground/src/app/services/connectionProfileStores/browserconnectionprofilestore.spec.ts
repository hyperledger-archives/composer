/* tslint:disable:no-var-requires */
import { BrowserConnectionProfileStore } from './browserconnectionprofilestore';

import * as chai from 'chai';

let should = chai.should();

describe('BrowserConnectionProfileStore', () => {

    let connectionProfileStore: BrowserConnectionProfileStore = null;

    beforeEach((done) => {
        window['localStorage'].clear();
        connectionProfileStore = new BrowserConnectionProfileStore();

        let promises = [];
        promises.push(connectionProfileStore.save('profileOne', {name: 'profileOne'}));
        promises.push(connectionProfileStore.save('profileTwo', {name: 'profileTwo'}));

        return Promise.all(promises).then(() => {
            done();
        });
    });

    afterEach(() => {
        window['localStorage'].clear();
    });

    describe('#load', () => {
        it('should load from the browser connection profile store', (done) => {
            return connectionProfileStore.load('profileTwo').then((result) => {
                result.should.deep.equal({name: 'profileTwo'});
                done();
            });
        });
    });

    describe('#save', () => {
        it('should save web profiles to the browser connection profile store', (done) => {
            return connectionProfileStore.save('profileThree', {name: 'profileThree'})
                .then(() => {
                    return connectionProfileStore.load('profileThree');
                })
                .then((result) => {
                    result.should.deep.equal({name: 'profileThree'});
                    done();
                });
        });

    });

    describe('#loadAll', () => {
        it('should load from both the browser connection profile stores', (done) => {
            window['localStorage'].setItem('not-profile', JSON.stringify({name: 'not-profile'}));

            return connectionProfileStore.loadAll().then((result) => {
                result.should.deep.equal({profileOne: {name: 'profileOne'}, profileTwo: {name: 'profileTwo'}});
                done();
            });
        });
    });

    describe('#delete', () => {
        it('should ignore errors for profiles that do not exist', (done) => {
            return connectionProfileStore.delete('no-profile')
                .then(() => {
                    done();
                })
                .catch(() => {
                    throw new Error('should not get here');
                });
        });

        it('should delete web profiles from the browser connection profile store', (done) => {
            return connectionProfileStore.delete('profileOne')
                .then(() => {
                    return connectionProfileStore.load('profileOne');
                })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.equal('does not exist profileOne');
                    done();
                });
        });
    });
});
