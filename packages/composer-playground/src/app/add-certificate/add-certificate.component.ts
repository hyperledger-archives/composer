import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { AlertService } from '../services/alert.service';

@Component({
    selector: 'add-certificate',
    templateUrl: './add-certificate.component.html',
    styleUrls: ['./add-certificate.component.scss'.toString()]
})

export class AddCertificateComponent {
    fileType = '';
    expandInput: boolean = false;
    maxFileSize: number = 5242880;
    supportedFileTypes: string[] = ['.pem'];
    addedCertificate: string = '';
    addedHostname: string = '';

    constructor(private alertService: AlertService,
                public activeModal: NgbActiveModal,
                private connectionProfileService: ConnectionProfileService) {

        this.addedCertificate = this.connectionProfileService.getCertificate();
        this.addedHostname = this.connectionProfileService.getHostname();
    }

    fileDetected() {
        this.expandInput = true;
    }

    fileLeft() {
        this.expandInput = false;
    }

    fileAccepted(file: File) {
        let type = file.name.substring(file.name.lastIndexOf('.'));

        this.getDataBuffer(file)
        .then((data) => {
            if (this.supportedFileTypes.indexOf(type) > -1) {
                // Is supported
                this.expandInput = true;
                this.createCertificate(type, data);
            } else {
                // Not supported
                throw new Error('Unsupported File Type');
            }
        })
        .catch((err) => {
            this.fileRejected(err);
        });
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

    createCertificate(type: string, dataBuffer) {
        this.fileType = type;
        this.addedCertificate = dataBuffer.toString();
    }

    fileRejected(reason: string) {
        this.alertService.errorStatus$.next(reason);
    }

    addCertificate(): void {
      let additionalData = {};
      additionalData['hostnameOverride'] = this.addedHostname;
      additionalData['cert'] = this.addedCertificate.replace(/[\\n\\r]/g, '');
      this.activeModal.close(additionalData);
    }
}
