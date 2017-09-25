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

    maxFileSize: number = 5242880;
    supportedFileTypes: string[] = ['.pem'];

    private userId: string = null;
    private userSecret: string = null;
    private busNetName: string = null;
    private addInProgress: boolean = false;
    private useCerts: boolean = true;
    private addedPublicCertificate: string;
    private addedPrivateCertificate: string;
    private formattedCert: string;
    private formattedPrivateKey: string;
    private useParticipantCard: boolean = true;
    private peerAdmin: boolean = false;
    private channelAdmin: boolean = false;
    private certFile: string;
    private privateFile: string;
    private fileType: string;
    private certType: string;

    constructor(private idCardService: IdentityCardService,
                private alertService: AlertService) {

    }

    close() {
        this.idCardAdded.emit(false);
    }

    useCertificates(option: boolean) {
        this.useCerts = option;
    }

    useParticipantCardType(option: boolean) {
        this.useParticipantCard = option;
    }

    validContents(): boolean {
        if (this.useCerts) {
            if (!this.addedPublicCertificate || this.addedPublicCertificate.length === 0) {
                return false;
            } else if (!this.addedPrivateCertificate || this.addedPrivateCertificate.length === 0) {
                return false;
            } else if (!this.userId || this.userId.length === 0) {
                return false;
            } else if (this.addInProgress) {
                return false;
            }
        } else {
            if (!this.userId || this.userId.length === 0) {
                return false;
            } else if (!this.userSecret || this.userSecret.length === 0) {
                return false;
            } else if (this.addInProgress) {
                return false;
            }
        }

        if (this.useParticipantCard) {
            if (!this.busNetName) {
                return false;
            }
        } else {
            if (!this.peerAdmin && !this.channelAdmin) {
                return false;
            }
        }

        return true;
    }

    submitCard(event) {
        if ((event && event.keyCode !== 13) || !this.validContents()) {
            return;
        } else {
            this.addIdentityCard();
        }
    }

    addIdentityCard() {
        this.addInProgress = true;
        this.alertService.busyStatus$.next({
            title: 'Adding ID card',
            text: 'Adding ID card'
        });

        if (this.useCerts) {
            this.formattedCert = this.formatCert(this.addedPublicCertificate);
            this.formattedPrivateKey = this.formatCert(this.addedPrivateCertificate);
        }

        let credentials = this.useCerts ? {
            certificate: this.formattedCert,
            privateKey: this.formattedPrivateKey
        } : null;

        let roles = [];

        if (this.peerAdmin) {
            roles.push('PeerAdmin');
        }

        if (this.channelAdmin) {
            roles.push('ChannelAdmin');
        }

        return this.idCardService.createIdentityCard(this.userId, this.busNetName, this.userSecret, this.connectionProfile, credentials, roles)
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

    formatCert(unformatted: string) {
        return  unformatted.replace(/\\r\\n|\\n\\r|\\n/g, '\n');
    }

    getDataBuffer(file: File) {
        return new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            fileReader.readAsArrayBuffer(file);
            fileReader.onload = () => {
                let dataBuffer = Buffer.from(fileReader.result);
                resolve(dataBuffer);
            };

            fileReader.onerror = (err) => {
                reject(err);
            };
        });
    }

    fileAccepted(file: File) {
        this.fileType = file.name.substr(file.name.lastIndexOf('.') + 1);
        this.getDataBuffer(file)
        .then((data) => {
            switch (this.fileType) {
                case 'pem':
                    this.certType = data.toString().charAt(11);
                    if (this.certType === 'C') {
                        this.certFile = this.formatCert(data.toString());
                        console.log('*&*&*&&*&', this.certFile);
                        this.addedPublicCertificate = this.certFile;
                    } else if (this.certType === 'P') {
                        this.privateFile = this.formatCert(data.toString());
                        this.addedPrivateCertificate = this.privateFile;
                    }
                    break;
                default:
                    throw new Error('Unexpected file type: ' + this.fileType);
            }
        })
        .catch((err) => {
            this.fileRejected(err);
        });
    }

    fileRejected(reason: string) {
        this.alertService.errorStatus$.next(reason);
    }

}
