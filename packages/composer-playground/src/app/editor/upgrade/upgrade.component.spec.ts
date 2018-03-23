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
import { ComponentFixture, TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { DebugElement, Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Logger, IdCard } from 'composer-common';
import { LocalStorageService } from 'angular-2-local-storage';
import { UpgradeComponent } from './upgrade.component';
import { IdentityCardService } from '../../services/identity-card.service';
import { AdminService } from '../../services/admin.service';

import * as sinon from 'sinon';
import * as chai from 'chai';

const should = chai.should();

@Component({
    template: `<upgrade-modal></upgrade-modal>`
})
class TestHostComponent {
    error: string = null;
}

describe('UpgradeComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    let upgradeElement: DebugElement;

    let peerCard: IdCard;
    let peerCard2: IdCard;
    let channelCard: IdCard;
    let channelCard2: IdCard;
    let cardRefs: string[] = [];

    let mockAdminService;
    let mockLocalStorage;
    let mockActiveModal;

    beforeEach(() => {
        // webpack can't handle dymanically creating a logger
        Logger.setFunctionalLogger({
            log: sinon.stub()
        });

        mockAdminService = sinon.createStubInstance(AdminService);
        mockLocalStorage = sinon.createStubInstance(LocalStorageService);
        mockActiveModal = sinon.createStubInstance(NgbActiveModal);

        TestBed.configureTestingModule({
            declarations: [
                UpgradeComponent,
                TestHostComponent
            ],
            providers: [IdentityCardService, {provide: AdminService, useValue: mockAdminService},
                {provide: LocalStorageService, useValue: mockLocalStorage}, {
                    provide: NgbActiveModal,
                    useValue: mockActiveModal
                }]
        });

        mockAdminService.importCard.resolves();
        mockAdminService.deleteCard.resolves();

        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;

        upgradeElement = fixture.debugElement.query(By.css('upgrade-modal'));
    });

    beforeEach(fakeAsync(inject([IdentityCardService], (identityCardService: IdentityCardService) => {
        cardRefs = [];
        let cards: IdCard[] = [];

        let currentIdCard = new IdCard({userName: 'bob', businessNetwork: 'penguin-network'}, {
            name: 'mycp',
            type: 'hlfv1'
        });

        identityCardService.addIdentityCard(currentIdCard, null)
            .then((cardRef) => {
                return identityCardService.setCurrentIdentityCard(cardRef);
            });

        tick();

        peerCard = new IdCard({userName: 'PeerAdmin', roles: ['PeerAdmin']}, {
            name: 'mycp',
            type: 'hlfv1'
        });

        cards.push(peerCard);

        peerCard2 = new IdCard({userName: 'PeerAdmin2', roles: ['PeerAdmin']}, {
            name: 'mycp',
            type: 'hlfv1'
        });

        cards.push(peerCard2);

        channelCard = new IdCard({userName: 'ChannelAdmin', roles: ['ChannelAdmin']}, {
            name: 'mycp',
            type: 'hlfv1'
        });

        cards.push(channelCard);

        channelCard2 = new IdCard({userName: 'ChannelAdmin2', roles: ['ChannelAdmin']}, {
            name: 'mycp',
            type: 'hlfv1'
        });

        cards.push(channelCard2);

        cards.reduce((addPromise, card) => {
            return addPromise.then(() => {
                return identityCardService.addIdentityCard(card, null);
            })
                .then((cardRef: string) => {
                    cardRefs.push(cardRef);
                });
        }, Promise.resolve());

        tick();

    })));

    it('should create', () => {
        component.should.be.ok;
    });

    describe('ngOnInit', () => {
        it('should get the peer admin cards and channel admin cards', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            upgradeElement.componentInstance['peerCards'].should.deep.equal([peerCard, peerCard2]);
            upgradeElement.componentInstance['channelCards'].should.deep.equal([channelCard, channelCard2]);
            upgradeElement.componentInstance.selectedPeerCardName.should.equal('PeerAdmin');
            upgradeElement.componentInstance.selectedPeerCard.should.deep.equal(peerCard);
            upgradeElement.componentInstance.selectedChannelCardName.should.equal('ChannelAdmin');
            upgradeElement.componentInstance.selectedChannelCard.should.deep.equal(channelCard);
        }));

        it('should not set selected cards if no cards', fakeAsync(inject([IdentityCardService], (identityCardService: IdentityCardService) => {
            cardRefs.reduce((deletePromise, cardRef) => {
                return deletePromise.then(() => {
                    return identityCardService.deleteIdentityCard(cardRef);

                });
            }, Promise.resolve());

            tick();

            fixture.detectChanges();
            tick();

            upgradeElement.componentInstance['peerCards'].should.deep.equal([]);
            upgradeElement.componentInstance['channelCards'].should.deep.equal([]);
            should.not.exist(upgradeElement.componentInstance.selectedPeerCardName);
            should.not.exist(upgradeElement.componentInstance.selectedPeerCard);
            should.not.exist(upgradeElement.componentInstance.selectedChannelCardName);
            should.not.exist(upgradeElement.componentInstance.selectedChannelCard);

            let noPeerElement = upgradeElement.query(By.css('#no_peer_cards'));
            noPeerElement.nativeElement.textContent.should.equal('No cards available to use for network install');

            let noChannelElement = upgradeElement.query(By.css('#no_channel_cards'));
            noChannelElement.nativeElement.textContent.should.equal('No cards available to use for network upgrade');

            let upgradeButton = upgradeElement.query(By.css('#upgrade_confirm'));
            upgradeButton.nativeElement.disabled.should.equal(true);
        })));
    });

    describe('onPeerCardSelect', () => {
        it('should set the selected card', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let options = upgradeElement.queryAll(By.css('#peer_drop_down .dropdown-item.action'));

            options[1].triggerEventHandler('click', null);

            tick();

            upgradeElement.componentInstance['selectedPeerCardName'].should.equal('PeerAdmin2');
            upgradeElement.componentInstance['selectedPeerCard'].should.deep.equal(peerCard2);
        }));
    });

    describe('onChannelCardSelect', () => {
        it('should set the selected card', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let options = upgradeElement.queryAll(By.css('#channel_drop_down .dropdown-item.action'));

            options[1].triggerEventHandler('click', null);

            tick();

            upgradeElement.componentInstance['selectedChannelCardName'].should.equal('ChannelAdmin2');
            upgradeElement.componentInstance['selectedChannelCard'].should.deep.equal(channelCard2);
        }));
    });

    describe('upgrade', () => {
        it('should close the modal and return selected cards', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let upgradeButton = upgradeElement.query(By.css('#upgrade_confirm'));
            upgradeButton.triggerEventHandler('click', null);

            mockActiveModal.close.should.have.been.calledWith({peer: peerCard, channel: channelCard});

        }));
    });

    describe('cancel', () => {
        it('should close the modal when press cancel', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let upgradeButton = upgradeElement.query(By.css('#upgrade_cancel'));
            upgradeButton.triggerEventHandler('click', null);
            mockActiveModal.dismiss.should.have.been.called;
        }));

        it('should close the modal when press cross', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let upgradeButton = upgradeElement.query(By.css('#upgrade-file_exit'));
            upgradeButton.triggerEventHandler('click', null);
            mockActiveModal.dismiss.should.have.been.called;
        }));
    });
});
