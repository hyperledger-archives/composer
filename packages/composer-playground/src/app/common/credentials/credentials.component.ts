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

    fileAccepted(file: File, type: string) {
        this.fileType = file.name.substr(file.name.lastIndexOf('.') + 1);
        this.getDataBuffer(file)
            .then((data) => {
                this.expandInput = true;
                this.certType = data.toString().substring(0, 27);
                if (this.certType === '-----BEGIN CERTIFICATE-----' && (type === 'public' || !type)) {
                    this.setPublicCert(data.toString());
                } else if (this.certType === '-----BEGIN PRIVATE KEY-----' && (type === 'private' || !type)) {
                    this.setPrivateCert(data.toString());
                } else {
                    throw new Error('Certificate content in unexpected format.');
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
