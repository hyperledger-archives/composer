import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AlertService } from '../../basic-modals/alert.service';
import { IdentityCardService } from '../../services/identity-card.service';

@Component({
    selector: 'edit-card-credentials',
    templateUrl: './edit-card-credentials.component.html',
    styleUrls: ['./edit-card-credentials.component.scss'.toString()]
})

export class EditCardCredentialsComponent {

    @Input() connectionProfile: any;
    @Output() idCardAdded = new EventEmitter<any>();

    private userId: string = null;
    private userSecret: string = null;
    private busNetName: string = null;
    private addInProgress: boolean = false;
    private useCerts: boolean = false;

    constructor(private idCardService: IdentityCardService,
                private alertService: AlertService) {

    }

    close() {
        this.idCardAdded.emit(false);
    }

    useCertificates(option: boolean) {
        this.useCerts = option;
    }

    validContents(): boolean {
        if (this.useCerts) {
            return false;
        } else {
            return ((this.userId !== null && this.userId.length !== 0 &&
                     this.userSecret !== null && this.userSecret.length !== 0) ||
                     this.addInProgress);
        }
    }

    addIdentityCard() {
        this.addInProgress = true;
        this.alertService.busyStatus$.next({
            title: 'Adding ID card',
            text: 'Adding ID card'
        });
        return this.idCardService.createIdentityCard(this.userId, this.busNetName, this.userId, this.userSecret, this.connectionProfile)
        .then(() => {
            this.alertService.busyStatus$.next(null);
            this.alertService.successStatus$.next({
                title: 'ID Card Added',
                text: 'The ID card was successfully added to My Wallet.',
                icon: '#icon-role_24'
            });
            this.addInProgress = false;
            this.idCardAdded.emit(true);
        })
        .catch((error) => {
            this.alertService.busyStatus$.next(null);
            this.alertService.errorStatus$.next(error);
            this.addInProgress = false;
            this.idCardAdded.emit(false);
        });
    }
}
