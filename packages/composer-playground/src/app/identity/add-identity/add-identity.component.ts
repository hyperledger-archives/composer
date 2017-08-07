import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ConnectionProfileService } from '../../services/connectionprofile.service';
import { AlertService } from '../../basic-modals/alert.service';
import { WalletService } from '../../services/wallet.service';
import { IdentityCardService } from '../../services/identity-card.service';

@Component({
    selector: 'add-identity',
    templateUrl: './add-identity.component.html',
    styleUrls: ['./add-identity.component.scss'.toString()]
})

export class AddIdentityComponent {

    @Input() targetProfile: string;
    @Output() identityAdded = new EventEmitter<any>();
    @Output() cancelAdd = new EventEmitter<any>();

    private userId: string = null;
    private userSecret: string = null;
    private busNetName: string = null;
    private addInProgress: boolean = false;
    private useCerts: boolean = false;

    constructor(private connectionProfileService: ConnectionProfileService,
                private alertService: AlertService,
                private identityCardService: IdentityCardService) {

    }

    close() {
        this.cancelAdd.emit(true);
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

    addIdentity() {
        this.addInProgress = true;
        this.alertService.busyStatus$.next({
                title: 'Adding ID card',
                text: 'adding ID card ' + this.userId
            });
        return this.identityCardService.createIdentityCard(this.userId, this.busNetName, this.userId, this.userSecret, this.targetProfile)
        .then(() => {
                this.alertService.busyStatus$.next(null);
                this.alertService.successStatus$.next({
                    title: 'ID Card Added',
                    text: 'The ID card was successfully added to My Wallet.',
                    icon: '#icon-role_24'
                });
                this.addInProgress = false;
                this.identityAdded.emit({success: true});
            })
        .catch((error) => {
            this.alertService.busyStatus$.next(null);
            this.alertService.errorStatus$.next(error);
            this.addInProgress = false;
            this.identityAdded.emit({success: false});
        });
    }
}
