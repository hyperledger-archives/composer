import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ConnectionProfileService } from '../../services/connectionprofile.service';
import { AlertService } from '../../basic-modals/alert.service';
import { WalletService } from '../../services/wallet.service';

@Component({
    selector: 'add-identity',
    templateUrl: './add-identity.component.html',
    styleUrls: ['./add-identity.component.scss'.toString()]
})

export class AddIdentityComponent {

    @Input() targetProfileName: string;
    @Output() identityAdded = new EventEmitter<any>();
    @Output() cancelAdd = new EventEmitter<any>();

    private userId: string = null;
    private userSecret: string = null;
    private busNetName: string = null;
    private addInProgress: boolean = false;
    private useCerts: boolean = false;

    constructor(private connectionProfileService: ConnectionProfileService,
                private walletService: WalletService,
                private alertService: AlertService) {

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
        let wallet = this.walletService.getWallet(this.targetProfileName);
        return wallet.contains(this.userId)
        .then((contains) => {
            if (contains) {
                this.alertService.busyStatus$.next({
                        title: 'Updating ID card',
                        text: 'updating the ID card ' + this.userId
                    });
                return wallet.update(this.userId, this.userSecret)
                .then(() => {
                        this.alertService.busyStatus$.next(null);
                        this.alertService.successStatus$.next({
                            title: 'ID Card Updated',
                            text: 'The ID card was successfully updated within My Wallet.',
                            icon: '#icon-role_24'
                        });
                        this.addInProgress = false;
                        this.identityAdded.emit({success: true});
                    });

            } else {
                this.alertService.busyStatus$.next({
                        title: 'Adding ID card',
                        text: 'adding ID card ' + this.userId
                    });
                return wallet.add(this.userId, this.userSecret)
                .then(() => {
                        this.alertService.busyStatus$.next(null);
                        this.alertService.successStatus$.next({
                            title: 'ID Card Added',
                            text: 'The ID card was successfully added to My Wallet.',
                            icon: '#icon-role_24'
                        });
                        this.addInProgress = false;
                        this.identityAdded.emit({success: true});
                    });
            }
        })
        .catch((error) => {
            this.alertService.busyStatus$.next(null);
            this.alertService.errorStatus$.next(error);
            this.addInProgress = false;
            this.identityAdded.emit({success: false});
        });
    }
}
