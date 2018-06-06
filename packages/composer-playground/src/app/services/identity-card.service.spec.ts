/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { IdCard } from 'composer-common';
import { AdminService } from './admin.service';

import * as sinon from 'sinon';
import * as chai from 'chai';

const hash = require('object-hash');

let should = chai.should();

import { IdentityCardService } from './identity-card.service';
import { LocalStorageService } from 'angular-2-local-storage';

describe('IdentityCardService', () => {

    let mockAdminService;
    let mockLocalStorage;

    beforeEach(() => {
        mockAdminService = sinon.createStubInstance(AdminService);
        mockLocalStorage = sinon.createStubInstance(LocalStorageService);

        TestBed.configureTestingModule({
            providers: [IdentityCardService,
                {provide: AdminService, useValue: mockAdminService},
                {provide: LocalStorageService, useValue: mockLocalStorage}
            ]
        });
    });

    describe('#getIdentityCard', () => {
        it('should get the specified identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard = sinon.createStubInstance(IdCard);
            let mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;

            service.getIdentityCard('test').should.equal(mockIdCard);
        })));

        it('should not get an identity card if it does not exist', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            should.not.exist(service.getIdentityCard('test'));
        })));
    });

    describe('#getCurrentIdentityCard', () => {
        it('should get the current identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard = sinon.createStubInstance(IdCard);
            let mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;
            service['currentCard'] = 'test';

            service.getCurrentIdentityCard().should.equal(mockIdCard);
        })));

        it('should not get an identity card if there is no current identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            should.not.exist(service.getCurrentIdentityCard());
        })));
    });

    describe('#getIndestructibleIdentityCards', () => {
        it('should get an array of indestructible identity card refs', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            service['indestructibleCards'] = ['uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'];

            service.getIndestructibleIdentityCards().should.deep.equal(['uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx']);
        })));
    });

    describe('canDeploy', () => {
        it('should return true if PeerAdmin and ChannelAdmin cards are available', inject([IdentityCardService], (service: IdentityCardService) => {
            let getIdentityCardRefsWithProfileAndRoleStub = sinon.stub(service, 'getIdentityCardRefsWithProfileAndRole').returns(['web-cardRef']);

            let result = service.canDeploy('1234');

            result.should.equal(true);

            getIdentityCardRefsWithProfileAndRoleStub.should.have.been.calledTwice;
            getIdentityCardRefsWithProfileAndRoleStub.firstCall.should.have.been.calledWith('1234', 'PeerAdmin');
            getIdentityCardRefsWithProfileAndRoleStub.secondCall.should.have.been.calledWith('1234', 'ChannelAdmin');
        }));

        it('should return false if no PeerAdmin Role', inject([IdentityCardService], (service: IdentityCardService) => {
            let getIdentityCardRefsWithProfileAndRoleStub = sinon.stub(service, 'getIdentityCardRefsWithProfileAndRole').returns([]);

            let result = service.canDeploy('1234');

            result.should.equal(false);

            getIdentityCardRefsWithProfileAndRoleStub.should.have.been.calledOnce;
            getIdentityCardRefsWithProfileAndRoleStub.should.have.been.calledWith('1234', 'PeerAdmin');
        }));

        it('should not show deploy button if not got ChannelAdmin role', inject([IdentityCardService], (service: IdentityCardService) => {
            let getIdentityCardRefsWithProfileAndRoleStub = sinon.stub(service, 'getIdentityCardRefsWithProfileAndRole');
            getIdentityCardRefsWithProfileAndRoleStub.onFirstCall().returns(['web-cardRef']);
            getIdentityCardRefsWithProfileAndRoleStub.onSecondCall().returns([]);

            let result = service.canDeploy('1234');

            result.should.equal(false);

            getIdentityCardRefsWithProfileAndRoleStub.should.have.been.calledTwice;
            getIdentityCardRefsWithProfileAndRoleStub.firstCall.should.have.been.calledWith('1234', 'PeerAdmin');
            getIdentityCardRefsWithProfileAndRoleStub.secondCall.should.have.been.calledWith('1234', 'ChannelAdmin');
        }));
    });

    describe('#getIdentityCardForExport', () => {
        it('should get a card for export', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let idCard1 = new IdCard({
                version: 1,
                userName: 'card1',
                businessNetworkName: 'assassin-network',
                enrollmentSecret: 'adminpw'
            }, {name: 'hlfv1'});

            mockAdminService.exportCard.returns(idCard1);

            let result = service.getIdentityCardForExport('1234');

            result.should.deep.equal(idCard1);
        })));
    });

    describe('#loadIdentityCards', () => {
        it('should load cards from card store', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let idCardMap: Map<string, IdCard> = new Map<string, IdCard>();

            let idCard1 = new IdCard({
                version: 1,
                userName: 'card1',
                businessNetworkName: 'assassin-network',
                enrollmentSecret: 'adminpw'
            }, {name: 'hlfv1'});

            let idCard2 = new IdCard({
                version: 1,
                userName: 'card2',
                businessNetworkName: 'assassin-network',
                enrollmentSecret: 'adminpw'
            }, {name: 'hlfv1'});

            idCardMap.set('cardOne', idCard1);
            idCardMap.set('cardTwo', idCard2);

            mockAdminService.getAllCards.returns(Promise.resolve(idCardMap));

            let indestructableCardsStub = sinon.stub(service, 'getIndestructibleCardRefs').returns(['1234', '4321']);

            let getCurrentCardRefStub = sinon.stub(service, 'getCurrentCardRefLocalStorage');
            let setCurrentCardRefStub = sinon.stub(service, 'setCurrentCardRefLocalStorage');

            let setCurrentIdentityCardStub = sinon.stub(service, 'setCurrentIdentityCard');
            setCurrentIdentityCardStub.returns(Promise.resolve());

            let result: number;
            service['currentCard'] = 'someCardRef';
            service.loadIdentityCards().then((cardsLoaded) => {
                result = cardsLoaded;
            });

            tick();

            result.should.equal(2);
            service['idCards'].size.should.equal(2);
            should.not.exist(service['currentCard']);
            setCurrentIdentityCardStub.should.not.have.been.called;
            setCurrentCardRefStub.should.have.been.calledWith(null);
        })));

        it('should load cards from card store and set current card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let idCardMap: Map<string, IdCard> = new Map<string, IdCard>();

            let idCard1 = new IdCard({
                version: 1,
                userName: 'card1',
                businessNetworkName: 'assassin-network',
                enrollmentSecret: 'adminpw'
            }, {name: 'hlfv1'});

            let idCard2 = new IdCard({
                version: 1,
                userName: 'card2',
                businessNetworkName: 'assassin-network',
                enrollmentSecret: 'adminpw'
            }, {name: 'hlfv1'});

            idCardMap.set('cardOne', idCard1);
            idCardMap.set('cardTwo', idCard2);

            mockAdminService.getAllCards.returns(Promise.resolve(idCardMap));

            let indestructableCardsStub = sinon.stub(service, 'getIndestructibleCardRefs').returns(['1234', '4321']);

            let getCurrentCardRefStub = sinon.stub(service, 'getCurrentCardRefLocalStorage').returns('cardTwo');
            ;
            let setCurrentCardRefStub = sinon.stub(service, 'setCurrentCardRefLocalStorage');

            let setCurrentIdentityCardStub = sinon.stub(service, 'setCurrentIdentityCard');
            setCurrentIdentityCardStub.returns(Promise.resolve());

            let result: number;
            service['currentCard'] = 'someCardRef';
            service.loadIdentityCards().then((cardsLoaded) => {
                result = cardsLoaded;
            });

            tick();

            result.should.equal(2);

            service['idCards'].size.should.equal(2);
            setCurrentIdentityCardStub.should.have.been.calledWith('cardTwo');
            setCurrentCardRefStub.should.not.have.been.called;

            service['indestructibleCards'].should.deep.equal(['1234', '4321']);
        })));

        it('should not load anything if there are no cards in local storage', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let idCardMap: Map<string, IdCard> = new Map<string, IdCard>();

            mockAdminService.getAllCards.returns(Promise.resolve(idCardMap));

            let indestructableCardsStub = sinon.stub(service, 'getIndestructibleCardRefs').returns(['1234', '4321']);

            let result: number;
            service.loadIdentityCards().then((cardsLoaded) => {
                result = cardsLoaded;
            });

            tick();

            result.should.equal(0);
        })));
    });

    describe('#getIdentityCards', () => {
        it('should get identity cards', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let loadIdentityCardsSpy = sinon.spy(service, 'loadIdentityCards');
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getUserName.returns('penguin');
            let mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;

            let result;
            service.getIdentityCards().then((idCards) => {
                result = idCards;
            });

            tick();

            result.size.should.equal(1);
            result.get('test').getUserName().should.equal('penguin');
            loadIdentityCardsSpy.should.not.have.been.called;
        })));

        it('should reload and get identity cards', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let loadIdentityCardsSpy = sinon.stub(service, 'loadIdentityCards').returns(Promise.resolve());
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getUserName.returns('penguin');
            let mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;

            let result;
            service.getIdentityCards(true).then((idCards) => {
                result = idCards;
            });

            tick();

            result.size.should.equal(1);
            result.get('test').getUserName().should.equal('penguin');
            loadIdentityCardsSpy.should.have.been.called;
        })));
    });

    describe('#addInitialIdentityCards', () => {
        it('should create initial identity cards from array', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard1 = sinon.createStubInstance(IdCard);
            let mockIdCard2 = sinon.createStubInstance(IdCard);
            let initialCards = [mockIdCard1, mockIdCard2];
            let addIdentityCardStub = sinon.stub(service, 'addIdentityCard');
            let qcpStub = sinon.stub(service, 'getQualifiedProfileName').returns('qcp');
            let getCardRefFromIdentityStub = sinon.stub(service, 'getCardRefFromIdentity');

            addIdentityCardStub.onFirstCall().returns(Promise.resolve('cardOne'));
            addIdentityCardStub.onSecondCall().returns(Promise.resolve('cardTwo'));
            addIdentityCardStub.onThirdCall().returns(Promise.resolve('cardThree'));

            let cardRefs;
            service.addInitialIdentityCards(initialCards).then((results) => {
                cardRefs = results;
                cardRefs.should.deep.equal(['cardOne', 'cardTwo', 'cardThree']);
            });

            tick();

            addIdentityCardStub.should.have.been.calledThrice;
        })));

        it('should only add cards that don\'t exist', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard1 = sinon.createStubInstance(IdCard);
            let mockIdCard2 = sinon.createStubInstance(IdCard);
            let initialCards = [mockIdCard1, mockIdCard2];
            let addIdentityCardStub = sinon.stub(service, 'addIdentityCard');
            let qcpStub = sinon.stub(service, 'getQualifiedProfileName').returns('qcp');
            let getCardRefFromIdentityStub = sinon.stub(service, 'getCardRefFromIdentity');

            getCardRefFromIdentityStub.onFirstCall().returns(null);
            getCardRefFromIdentityStub.onSecondCall().returns('cardTwo');

            addIdentityCardStub.onFirstCall().returns(Promise.resolve('cardOne'));
            addIdentityCardStub.onSecondCall().returns(Promise.resolve('cardThree'));

            let cardRefs;
            service.addInitialIdentityCards(initialCards).then((results) => {
                cardRefs = results;
                cardRefs.should.deep.equal(['cardOne', 'cardThree']);
            });

            tick();

            addIdentityCardStub.should.have.been.calledTwice;
        })));
    });

    describe('#createIdentityCard', () => {
        it('should create and store an identity card using enrollment ID and secret', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let addIdentityCardSpy = sinon.spy(service, 'addIdentityCard');
            let cardMock = sinon.createStubInstance(IdCard);
            let connectionProfile = {
                name: 'hlfv1'
            };

            mockAdminService.importCard.returns(Promise.resolve('1234'));

            service.createIdentityCard('admin', 'myCardName', 'cashless-network', 'adminpw', connectionProfile, null, [])
                .then((cardRef: string) => {
                    let myCard = service.getIdentityCard(cardRef);
                    myCard.getCredentials().should.be.empty;
                }).catch((error) => {
                fail('test failed with error' + error);
            });

            tick();

            service['idCards'].size.should.equal(1);
            cardMock.setCredentials.should.not.have.been.called;
            addIdentityCardSpy.should.have.been.called;
        })));

        it('should create and store an identity card using certificates and roles', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let addIdentityCardSpy = sinon.spy(service, 'addIdentityCard');
            let connectionProfile = {
                name: 'hlfv1'
            };
            let credentials = {
                certificate: 'certificate',
                privateKey: 'privateKey'
            };

            mockAdminService.importCard.returns(Promise.resolve('1234'));

            service.createIdentityCard('admin', 'myCardName', 'cashless-network', null, connectionProfile, credentials, ['PeerAdmin', 'ChannelAdmin'])
                .then((cardRef: string) => {
                    let myCard = service.getIdentityCard(cardRef);
                    myCard.getCredentials().should.deep.equal(credentials);
                    myCard.getRoles().should.deep.equal(['PeerAdmin', 'ChannelAdmin']);
                }).catch((error) => {
                fail('test failed with error' + error);
            });

            tick();

            service['idCards'].size.should.equal(1);
            addIdentityCardSpy.should.have.been.called;
        })));
    });

    describe('#addIdentityCard', () => {
        it('should add an identity card without credentials and no card name', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getUserName.returns('bcc');
            mockIdCard.getBusinessNetworkName.returns('bn');

            mockAdminService.importCard.returns(Promise.resolve('1234'));

            let result;
            service.addIdentityCard(mockIdCard, null).then((cardRef) => {
                result = cardRef;
            });

            tick();

            mockAdminService.importCard.should.have.been.calledWith('bcc@bn', mockIdCard);

            service['idCards'].size.should.equal(1);
            service['indestructibleCards'].length.should.equal(0);
        })));

        it('should add an indestructible identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getUserName.returns('bcc');

            mockAdminService.importCard.returns(Promise.resolve('1234'));

            let result;
            service.addIdentityCard(mockIdCard, 'myCardName', true).then((cardRef) => {
                result = cardRef;
            });

            tick();

            service['idCards'].size.should.equal(1);
            service['indestructibleCards'].length.should.equal(1);
            service['indestructibleCards'][0].should.equal(result);
        })));
    });

    describe('#deleteIdentityCard', () => {
        const mockConnectionProfile = {
            name: 'hlfv1'
        };
        let mockIdCard;

        const setupTest = (service: IdentityCardService) => {
            mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getUserName.returns('alice');
            mockIdCard.getConnectionProfile.returns(mockConnectionProfile);
            mockIdCard.getEnrollmentCredentials.returns({
                secret: 'sauce'
            });
            const mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;
        };

        it('should delete an identity card and remove from wallet', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            setupTest(service);
            sinon.stub(service, 'getAllCardRefsForProfile').returns(['1234']);

            service.deleteIdentityCard('test');

            tick();

            let expectedProfileName = hash(mockConnectionProfile) + '-hlfv1';
            service['idCards'].size.should.equal(0);
            mockAdminService.deleteCard.should.have.been.calledWith('test');
        })));

        it('should delete an identity card and not remove if not in wallet', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            setupTest(service);
            sinon.stub(service, 'getAllCardRefsForProfile').returns(['1234']);

            service.deleteIdentityCard('test');

            tick();

            let expectedProfileName = hash(mockConnectionProfile) + '-hlfv1';
            service['idCards'].size.should.equal(0);
            mockAdminService.deleteCard.should.have.been.calledWith('test');
        })));

        it('should delete an identity card that doesn\'t have an enrollment id', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            setupTest(service);
            sinon.stub(service, 'getAllCardRefsForProfile').returns(['1234']);
            mockIdCard.getEnrollmentCredentials.returns(null);

            service.deleteIdentityCard('test');

            tick();

            let expectedProfileName = hash(mockConnectionProfile) + '-hlfv1';
            service['idCards'].size.should.equal(0);

            mockAdminService.deleteCard.should.have.been.calledWith('test');
        })));

        it('should not delete an identity card that does not exist', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let result;
            service.deleteIdentityCard('test').then(() => {
                throw Error('Identity card deleted without error');
            }, (reason) => {
                result = reason;
            });

            tick();

            result.message.should.equal('Identity card does not exist');
        })));
    });

    describe('#setCurrentIdentityCard', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockConnectionProfile2;
        let mockCardMap;
        let setCurrentCardRefStub;

        beforeEach(inject([IdentityCardService], (service: IdentityCardService) => {
            setCurrentCardRefStub = sinon.stub(service, 'setCurrentCardRefLocalStorage');

            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getEnrollmentCredentials.returns({id: 'admin'});
            mockIdCard1.getConnectionProfile.returns({'name': '$default', 'x-type': 'web'});

            mockConnectionProfile2 = {name: 'hlfv1'};
            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getEnrollmentCredentials.returns({id: 'admin'});
            mockIdCard2.getConnectionProfile.returns(mockConnectionProfile2);

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard1);
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard2);
        }));

        it('should unset the current identity if null passed in', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            service.setCurrentIdentityCard(null);

            should.not.exist(service['currentCard']);

            tick();

            setCurrentCardRefStub.should.have.been.calledWith(null);

        })));

        it('should set the current identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            service['idCards'] = mockCardMap;

            service.setCurrentIdentityCard('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

            tick();

            setCurrentCardRefStub.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        })));

        it('should not set the current identity card to one that does not exist', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let result;
            service.setCurrentIdentityCard('uuid0xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').then((currentCard) => {
                throw Error('Current identity card set without error');
            }, (reason) => {
                result = reason;
            });

            tick();

            result.message.should.equal('Identity card does not exist');
        })));
    });

    describe('getIdentityCardRefsWithProfileAndRole', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockIdCard3;
        let mockConnectionProfile1;
        let mockConnectionProfile2;
        let mockConnectionProfile3;
        let mockCardMap;

        beforeEach(() => {
            mockConnectionProfile1 = {name: 'myProfile'};
            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getUserName.returns('card1');
            mockIdCard1.getConnectionProfile.returns(mockConnectionProfile1);
            mockIdCard1.getRoles.returns(['myRole']);

            mockConnectionProfile2 = {name: 'myOtherProfile'};
            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getUserName.returns('card2');
            mockIdCard2.getConnectionProfile.returns(mockConnectionProfile2);
            mockIdCard2.getRoles.returns(['myOtherRole']);

            mockConnectionProfile3 = {name: 'myProfile'};
            mockIdCard3 = sinon.createStubInstance(IdCard);
            mockIdCard3.getUserName.returns('card3');
            mockIdCard3.getConnectionProfile.returns(mockConnectionProfile3);
            mockIdCard3.getRoles.returns(['myRole']);

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard1);
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard2);
            mockCardMap.set('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard3);
        });

        it('should get an identity card with matching profile and role', inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdCard3.getRoles.returns(['myOtherRole']);
            service['idCards'] = mockCardMap;

            let connectionProfileName = hash(mockConnectionProfile1) + '-myProfile';
            let result = service.getIdentityCardRefsWithProfileAndRole(connectionProfileName, 'myRole');

            result.length.should.equal(1);
            result[0].should.equal('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        }));

        it('should get all identity cards with matching profile and role', inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdCard2.getRoles.returns(['myRole']);
            service['idCards'] = mockCardMap;

            let connectionProfileName = hash(mockConnectionProfile1) + '-myProfile';
            let result = service.getIdentityCardRefsWithProfileAndRole(connectionProfileName, 'myRole');

            result.length.should.equal(2);
            result[0].should.equal('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
            result[1].should.equal('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        }));

        it('should not get an identity card if there were no matching connection profiles', inject([IdentityCardService], (service: IdentityCardService) => {
            service['idCards'] = mockCardMap;

            let result = service.getIdentityCardRefsWithProfileAndRole('wotNoProfile', 'myRole');

            result.should.be.empty;
        }));

        it('should not get an identity card if there were no matching roles', inject([IdentityCardService], (service: IdentityCardService) => {
            service['idCards'] = mockCardMap;

            let result = service.getIdentityCardRefsWithProfileAndRole('myProfile', 'wotNoRole');

            result.should.be.empty;
        }));
    });

    describe('getAdminCardRef', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockIdCard3;
        let mockIdCard4;
        let mockConnectionProfile;
        let mockConnectionProfile2;
        let mockCardMap;
        let connectionProfileName;
        let connectionProfileName2;

        beforeEach(() => {
            mockConnectionProfile = {name: 'myProfile'};
            mockConnectionProfile2 = {name: 'myOtherProfile'};

            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getUserName.returns('card1');
            mockIdCard1.getConnectionProfile.returns(mockConnectionProfile);
            mockIdCard1.getRoles.returns(['myRole']);

            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getUserName.returns('card2');
            mockIdCard2.getConnectionProfile.returns(mockConnectionProfile);
            mockIdCard2.getRoles.returns(['myOtherRole']);

            mockIdCard3 = sinon.createStubInstance(IdCard);
            mockIdCard3.getUserName.returns('card3');
            mockIdCard3.getConnectionProfile.returns(mockConnectionProfile);
            mockIdCard3.getRoles.returns(['myRole']);

            mockIdCard4 = sinon.createStubInstance(IdCard);
            mockIdCard4.getUserName.returns('card4');
            mockIdCard4.getConnectionProfile.returns(mockConnectionProfile2);
            mockIdCard4.getRoles.returns(['myRole']);

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard1);
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard2);
            mockCardMap.set('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard3);
            mockCardMap.set('uuid4xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard4);

            connectionProfileName = hash(mockConnectionProfile) + '-myProfile';
            connectionProfileName2 = hash(mockConnectionProfile2) + '-myOtherProfile';
        });

        it('should get the current card ref if it has the required role', inject([IdentityCardService], (service: IdentityCardService) => {
            service['currentCard'] = 'uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
            service['idCards'] = mockCardMap;

            let result = service.getAdminCardRef(connectionProfileName, 'myRole');

            result.should.equal('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        }));

        it('should get the first available card that has the required role', inject([IdentityCardService], (service: IdentityCardService) => {
            service['currentCard'] = 'uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
            service['idCards'] = mockCardMap;

            let result = service.getAdminCardRef(connectionProfileName, 'myRole');

            result.should.equal('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        }));

        it('should get the first available card that has the required role when the passed qualified profile name does not match that of the current card', inject([IdentityCardService], (service: IdentityCardService) => {
            service['currentCard'] = 'uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
            service['idCards'] = mockCardMap;

            let result = service.getAdminCardRef(connectionProfileName2, 'myRole');

            result.should.equal('uuid4xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        }));

        it('should not get a card if there were none with the required role', inject([IdentityCardService], (service: IdentityCardService) => {
            service['currentCard'] = 'uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
            service['idCards'] = mockCardMap;

            let result = service.getAdminCardRef(connectionProfileName, 'wotNoRole');

            should.not.exist(result);
        }));
    });

    describe('getQualifiedProfileName', () => {
        it('should get a qualified profile name for a web connection profile', inject([IdentityCardService], (service: IdentityCardService) => {
            let connectionProfile = {
                'name': '$default',
                'x-type': 'web'
            };

            let qualifiedName = service.getQualifiedProfileName(connectionProfile);

            qualifiedName.should.equal('web-$default');
        }));

        it('should get a qualified profile name for other connection profiles', inject([IdentityCardService], (service: IdentityCardService) => {
            let connectionProfile = {
                name: 'hlfv1'
            };

            let qualifiedName = service.getQualifiedProfileName(connectionProfile);

            qualifiedName.should.equal(hash(connectionProfile) + '-hlfv1');
        }));
    });

    describe('getCardRefFromIdentity', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockIdCard3;
        let mockIdCard4;
        let mockConnectionProfile1;
        let mockConnectionProfile2;
        let mockConnectionProfile3;
        let mockConnectionProfile4;
        let mockCardMap;

        beforeEach(() => {
            mockConnectionProfile1 = {name: 'myProfile'};
            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getUserName.returns('myId');
            mockIdCard1.getBusinessNetworkName.returns('myNetwork');
            mockIdCard1.getConnectionProfile.returns(mockConnectionProfile1);

            // different id
            mockConnectionProfile2 = {name: 'myProfile'};
            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getUserName.returns('myId2');
            mockIdCard2.getBusinessNetworkName.returns('myNetwork');
            mockIdCard2.getConnectionProfile.returns(mockConnectionProfile2);

            // different profile
            mockConnectionProfile3 = {name: 'myProfile2'};
            mockIdCard3 = sinon.createStubInstance(IdCard);
            mockIdCard3.getUserName.returns('myId1');
            mockIdCard3.getBusinessNetworkName.returns('myNetwork');
            mockIdCard3.getConnectionProfile.returns(mockConnectionProfile3);

            // different network
            mockConnectionProfile4 = {name: 'myProfile'};
            mockIdCard4 = sinon.createStubInstance(IdCard);
            mockIdCard4.getUserName.returns('myId');
            mockIdCard4.getBusinessNetworkName.returns('myNetwork2');
            mockIdCard4.getConnectionProfile.returns(mockConnectionProfile4);

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard2);
            mockCardMap.set('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard3);
            mockCardMap.set('uuid4xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard4);
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard1);
        });

        it('should get a card ref from an identity', inject([IdentityCardService], (service: IdentityCardService) => {
            service['idCards'] = mockCardMap;

            let qpn = service.getQualifiedProfileName(mockConnectionProfile1);
            let result = service.getCardRefFromIdentity('myId', 'myNetwork', qpn);

            result.should.equal('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        }));
    });

    describe('getAllCardsForBusinessNetwork', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockIdCard3;
        let mockConnectionProfile1;
        let mockConnectionProfile2;
        let mockConnectionProfile3;
        let mockCardMap;

        beforeEach(() => {
            mockConnectionProfile1 = {name: 'myProfile'};
            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getBusinessNetworkName.returns('myNetwork');
            mockIdCard1.getConnectionProfile.returns(mockConnectionProfile1);

            // different network
            mockConnectionProfile2 = {name: 'myProfile'};
            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getBusinessNetworkName.returns('myNetwork2');
            mockIdCard2.getConnectionProfile.returns(mockConnectionProfile2);

            // different profile
            mockConnectionProfile3 = {name: 'myProfile2'};
            mockIdCard3 = sinon.createStubInstance(IdCard);
            mockIdCard3.getBusinessNetworkName.returns('myNetwork');
            mockIdCard3.getConnectionProfile.returns(mockConnectionProfile3);

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard2);
            mockCardMap.set('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard3);
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard1);
        });

        it('should get all the cards for a business network', inject([IdentityCardService], (service: IdentityCardService) => {
            service['idCards'] = mockCardMap;
            let qpn = service.getQualifiedProfileName(mockConnectionProfile1);
            let result = service.getAllCardsForBusinessNetwork('myNetwork', qpn);

            result.size.should.equal(1);

            let mapIter = result.keys();

            mapIter.next().value.should.equal('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        }));
    });

    describe('getAllCardRefsForProfile', () => {
        let mockIdCard1;
        let mockIdCard2;
        let mockConnectionProfile1;
        let mockConnectionProfile2;
        let mockCardMap;

        beforeEach(() => {
            mockConnectionProfile1 = {name: 'myProfile'};
            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getBusinessNetworkName.returns('myNetwork');
            mockIdCard1.getConnectionProfile.returns(mockConnectionProfile1);

            // different profile
            mockConnectionProfile2 = {name: 'myProfile2'};
            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getBusinessNetworkName.returns('myNetwork2');
            mockIdCard2.getConnectionProfile.returns(mockConnectionProfile2);

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard2);
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard1);
        });

        it('should get all the cards for a profile', inject([IdentityCardService], (service: IdentityCardService) => {
            service['idCards'] = mockCardMap;
            let qpn = service.getQualifiedProfileName(mockConnectionProfile1);
            let result = service.getAllCardRefsForProfile(qpn);

            result.should.deep.equal(['uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx']);
        }));
    });

    describe('getIndestructibleCardRefs', () => {
        it('should get the cards', inject([IdentityCardService], (service: IdentityCardService) => {
            let data = JSON.stringify(['1234', '54321']);

            mockLocalStorage.get.returns(data);

            let result = service.getIndestructibleCardRefs();

            result.should.deep.equal(['1234', '54321']);
        }));
    });

    describe('getCurrentCardRef', () => {
        it('should get the current card ref', inject([IdentityCardService], (service: IdentityCardService) => {
            service['currentCard'] = '1234';

            let result = service.getCurrentCardRef();

            result.should.equal('1234');
        }));
    });
});
