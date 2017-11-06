import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../../basic-modals/alert.service';

@Component({
    selector: 'add-certificate',
    templateUrl: './add-certificate.component.html',
    styleUrls: ['./add-certificate.component.scss'.toString()]
})

export class AddCertificateComponent {
    expandInput: boolean = false;
    maxFileSize: number = 5242880;
    supportedFileTypes: string[] = ['.pem'];
    certAdded: boolean = false;
    removeDisabled: boolean = true;

    @Input()
    cert: string = null;
    sslTargetNameOverride: string = null;
    type: string = null;

    constructor(private alertService: AlertService,
                public activeModal: NgbActiveModal) {
    }

    fileDetected() {
        this.expandInput = true;
    }

    fileLeft() {
        this.expandInput = false;
    }

    fileAccepted(file: File) {
        this.certAdded = true;
        let type = file.name.substring(file.name.lastIndexOf('.'));

        this.getDataBuffer(file)
            .then((data) => {
                this.cert = data.toString();
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

    fileRejected(reason: string) {
        this.alertService.errorStatus$.next(reason);
    }

    addCertificate(): void {
        let newCert = this.cert.replace(/\\r\\n|\\n\\r|\\n/g, '\n');
        this.activeModal.close({cert: newCert, sslTargetNameOverride: this.sslTargetNameOverride});
    }

    removeCertificate(): void {
      this.activeModal.close(null);
    }
}
