import { Component, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { AlertService } from '../../basic-modals/alert.service';

@Component({
    selector: 'credentials',
    templateUrl: './credentials.component.html',
    styleUrls: ['./credentials.component.scss'.toString()]
})

export class CredentialsComponent implements AfterViewInit {

    @Output() credentials = new EventEmitter<any>();

    @ViewChild('credentialsForm') credentialsForm;

    maxFileSize: number = 5242880;
    supportedFileTypes: string[] = ['.pem'];

    private userId: string = null;
    private userSecret: string = null;
    private useCerts: boolean = true;
    private addedPublicCertificate: string;
    private addedPrivateCertificate: string;

    private expandInput: boolean = false;

    private fileType: string;
    private certType: string;

    constructor(private alertService: AlertService) {
    }

    useCertificates(option: boolean) {
        this.useCerts = option;
    }

    ngAfterViewInit() {
        this.credentialsForm.control.valueChanges
            .subscribe(() => {
                this.validContents();
            });
    }

    validContents() {
        let valid: boolean = true;

        if (this.useCerts) {
            if (!this.addedPublicCertificate || this.addedPublicCertificate.length === 0) {
                valid = false;
            } else if (!this.addedPrivateCertificate || this.addedPrivateCertificate.length === 0) {
                valid = false;
            } else if (!this.userId || this.userId.length === 0) {
                valid = false;
            }

            if (valid) {
                this.addedPrivateCertificate = this.formatCert(this.addedPrivateCertificate);
                this.addedPublicCertificate = this.formatCert(this.addedPublicCertificate);

                this.credentials.emit({
                    userId: this.userId,
                    cert: this.addedPublicCertificate,
                    key: this.addedPrivateCertificate
                });
            }
        } else {
            if (!this.userId || this.userId.length === 0) {
                valid = false;
            } else if (!this.userSecret || this.userSecret.length === 0) {
                valid = false;
            }

            if (valid) {
                this.credentials.emit({userId: this.userId, secret: this.userSecret});
            }
        }

        if (!valid) {
            this.credentials.emit({});
        }
    }

    formatCert(unformatted: string) {
        return unformatted.replace(/\\r\\n|\\n\\r|\\n/g, '\n');
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

    fileDetected() {
        this.expandInput = true;
    }

    fileLeft() {
        this.expandInput = false;
    }

    fileAccepted(file: File) {
        this.fileType = file.name.substr(file.name.lastIndexOf('.') + 1);
        this.getDataBuffer(file)
            .then((data) => {
                switch (this.fileType) {
                    case 'pem':
                        this.expandInput = true;
                        this.certType = data.toString().substring(0, 27);
                        if (this.certType === '-----BEGIN CERTIFICATE-----') {
                            this.setPublicCert(data.toString());
                        } else if (this.certType === '-----BEGIN PRIVATE KEY-----') {
                            this.setPrivateCert(data.toString());
                        } else {
                            throw new Error('Certificate content in unexpected format.');
                        }
                        break;
                    default:
                        throw new Error('Unexpected file type: ' + this.fileType);
                }
                this.expandInput = false;
            })
            .catch((err) => {
                this.fileRejected(err);
            });
    }

    setPublicCert(cert: string) {
        this.addedPublicCertificate = this.formatCert(cert);
    }

    setPrivateCert(cert: string) {
        this.addedPrivateCertificate = this.formatCert(cert);
    }

    fileRejected(reason: string) {
        this.expandInput = false;
        this.alertService.errorStatus$.next(reason);
    }
}
