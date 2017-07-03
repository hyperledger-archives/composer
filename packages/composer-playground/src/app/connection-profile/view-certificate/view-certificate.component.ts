import { Component, Input } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConnectionProfileService } from '../../services/connectionprofile.service';
@Component({
    selector: 'view-certificate',
    templateUrl: './view-certificate.component.html',
    styleUrls: ['./view-certificate.component.scss'.toString()]
})
export class ViewCertificateComponent {
    public certificate: string;

    constructor(public activeModal: NgbActiveModal,
                public connectionProfileService: ConnectionProfileService) {
        this.certificate = this.connectionProfileService.getCertificate();
    }
}
