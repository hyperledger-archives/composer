/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { IdCard } from 'composer-common';

import { IdentityCardComponent } from './identity-card.component';

import * as chai from 'chai';
import * as sinon from 'sinon';

let should = chai.should();

describe(`IdentityCardComponent`, () => {

    let component: IdentityCardComponent;
    let fixture: ComponentFixture<IdentityCardComponent>;

    let mockIdCard;
    let mockConnectionProfile;

    beforeEach(() => {
        mockConnectionProfile = {
            name: 'dialup-modem'
        };

        mockIdCard = sinon.createStubInstance(IdCard);
        mockIdCard.getUserName.returns('pedantic-owl');
        mockIdCard.getBusinessNetworkName.returns('conga-network');
        mockIdCard.getConnectionProfile.returns(mockConnectionProfile);
        mockIdCard.getRoles.returns([]);

        TestBed.configureTestingModule({
            declarations: [IdentityCardComponent]
        });

        fixture = TestBed.createComponent(IdentityCardComponent);

        component = fixture.componentInstance;
    });

    describe('#connect', () => {
        it('should emit connect event', (done) => {
            component.identity = mockIdCard;

            component.onConnect.subscribe((e) => {
                e.should.equal('pedantic-owl');
                done();
            });

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.connect'));
            button.nativeElement.click();
        });
    });

    describe('deploySample', () => {
        it('should emit the deploy sample event', (done) => {
            let deploySampleSpy = sinon.spy(component, 'deploySample');
            let deployEventSpy = sinon.spy(component.onDeploySample, 'emit');

            component.showSpecial = true;

            component.onDeploySample.subscribe((data) => {
                should.not.exist(data);
                done();
            });

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.connect'));
            button.nativeElement.click();

            deploySampleSpy.should.have.been.called;
            deployEventSpy.should.have.been.called;
        });
    });

    describe('#dismiss', () => {
        it('should emit dismiss event', (done) => {
            component.showDismissIcon = true;
            component.identity = mockIdCard;

            component.onDismiss.subscribe((e) => {
                e.should.equal('pedantic-owl');
                done();
            });

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.dismiss'));
            button.nativeElement.click();
        });
    });

    describe('#delete', () => {
        it('should emit delete event', (done) => {
            component.identity = mockIdCard;

            component.onDelete.subscribe((e) => {
                e.should.equal('pedantic-owl');
                done();
            });

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.delete'));
            button.nativeElement.click();
        });
    });

    describe('#export', () => {
        it('should emit export event', (done) => {
            component.identity = mockIdCard;

            component.onExport.subscribe((e) => {
                e.should.equal('pedantic-owl');
                done();
            });

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.export'));
            button.nativeElement.click();
        });
    });

    describe('#getInitials', () => {
        it('should get one initial', () => {
            mockIdCard.getUserName.returns('admin');
            component.identity = mockIdCard;

            let result = component.getInitials();

            result.should.equal('a');
        });

        it('should get two initials', () => {
            mockIdCard.getUserName.returns('pedantic owl');
            component.identity = mockIdCard;

            let result = component.getInitials();

            result.should.equal('po');
        });

        it('should get maximum of two initials', () => {
            mockIdCard.getUserName.returns('eat conga repeat');
            component.identity = mockIdCard;

            let result = component.getInitials();

            result.should.equal('ec');
        });

        it('should get non-ascii \'initials\'', () => {
            mockIdCard.getUserName.returns('黄 丽');
            component.identity = mockIdCard;

            let result = component.getInitials();

            result.should.equal('黄丽');
        });

        it('should smile if there are no initials', () => {
            mockIdCard.getUserName.returns(' ');
            component.identity = mockIdCard;

            let result = component.getInitials();

            result.should.equal(':)');
        });
    });

    describe('#getRoles', () => {
        it('should get PeerAdmin role', () => {
            mockIdCard.getRoles.returns(['PeerAdmin']);
            component.identity = mockIdCard;

            let result = component.getRoles();

            result.should.deep.equal('PeerAdmin');
        });

        it('should get ChannelAdmin role', () => {
            mockIdCard.getRoles.returns(['ChannelAdmin']);
            component.identity = mockIdCard;

            let result = component.getRoles();

            result.should.deep.equal('ChannelAdmin');
        });

        it('should not get other roles', () => {
            mockIdCard.getRoles.returns(['GreenConga']);
            component.identity = mockIdCard;

            let result = component.getRoles();

            should.not.exist(result);
        });

        it('should get valid roles as comma separated string', () => {
            mockIdCard.getRoles.returns(['BlueConga', 'PeerAdmin', 'GreenConga', 'ChannelAdmin', 'PurpleConga']);
            component.identity = mockIdCard;

            let result = component.getRoles();

            result.should.deep.equal('PeerAdmin, ChannelAdmin');
        });
    });
});
