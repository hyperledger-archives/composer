import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
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
        mockIdCard.getName.returns('pedantic-owl');
        mockIdCard.getBusinessNetworkName.returns('conga-network');
        mockIdCard.getConnectionProfile.returns(mockConnectionProfile);

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

    describe('#dismiss', () => {
        it('should emit dismiss event', (done) => {
            component.preview = true;
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
            mockIdCard.getName.returns('admin');
            component.identity = mockIdCard;

            let result = component.getInitials();

            result.should.equal('a');
        });

        it('should get two initials', () => {
            mockIdCard.getName.returns('pedantic owl');
            component.identity = mockIdCard;

            let result = component.getInitials();

            result.should.equal('po');
        });

        it('should get maximum of two initials', () => {
            mockIdCard.getName.returns('eat conga repeat');
            component.identity = mockIdCard;

            let result = component.getInitials();

            result.should.equal('ec');
        });

        it('should get non-ascii \'initials\'', () => {
            mockIdCard.getName.returns('黄 丽');
            component.identity = mockIdCard;

            let result = component.getInitials();

            result.should.equal('黄丽');
        });

        it('should smile if there are no initials', () => {
            mockIdCard.getName.returns(' ');
            component.identity = mockIdCard;

            let result = component.getInitials();

            result.should.equal(':)');
        });
    });
});
