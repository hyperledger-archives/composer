import {Component, OnInit, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConnectionProfileService} from '../services/connectionprofile.service';
import {AlertService} from '../services/alert.service';

@Component({
  selector: 'add-certificate',
  templateUrl: './add-certificate.component.html',
  styleUrls: ['./add-certificate.component.scss'.toString()]
})
export class AddCertificateComponent {

  @Input() initialData: any = {};

  someData:any = {};
  currentFile = null;
  currentFileName = null;
  fileType = '';

  expandInput: boolean = false;

  maxFileSize: number = 5242880;
  supportedFileTypes: string[] = ['.pem'];

  addedCertificate: string = '';
  addedHostname: string = '';

  error = null;

  constructor(private alertService: AlertService,
              public activeModal: NgbActiveModal,
              private connectionProfileService: ConnectionProfileService) {

              this.addedCertificate = this.connectionProfileService.getCertificate();
              this.addedHostname = this.connectionProfileService.getHostname();

  }

  removeFile() {
    this.expandInput = false;
    this.currentFile = null;
    this.currentFileName = null;
    this.fileType = '';
  }

  fileDetected() {
    this.expandInput = true;
  }

  fileLeft() {
    this.expandInput = false;
  }

  fileAccepted(file: File) {
    let type = file.name.substr(file.name.lastIndexOf('.') + 1);
    this.getDataBuffer(file)
      .then((data) => {
        if (type === 'pem') {
          this.expandInput = true;
          this.createCertificate(file, data);
        }
        else {
          throw new Error('Unexpected File Type');
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

  createCertificate(file: File, dataBuffer) {
    this.fileType = 'pem';

    this.addedCertificate = dataBuffer.toString();

    // this.currentFileName = this.currentFile.getIdentifier();
  }



  fileRejected(reason: string) {
    this.alertService.errorStatus$.next(reason);
  }


  changeCurrentFileType() {
    this.currentFile = null;
  }

  private addCertificate(): void {
    let additionalData = {};
    additionalData['cert'] = this.addedCertificate;
    additionalData['hostnameOverride'] = this.addedHostname;
    this.activeModal.close(additionalData);

  }
}
