import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ClientService } from '../services/client.service';
import { InitializationService } from '../services/initialization.service';

@Component({
    selector: 'reset',
    templateUrl: './reset.component.html',
    styleUrls: ['./reset.component.scss'.toString()]
})

export class ResetComponent implements OnInit {

    private resetInProgress: boolean = false;

    constructor(private clientService: ClientService,
                private initializationService: InitializationService,
                private activeModal: NgbActiveModal) {

    }

    ngOnInit(): Promise<any> {
        return this.initializationService.initialize();
    }

    private reset() {
        this.resetInProgress = true;
        return this.clientService.reset()
        .then(() => {
            this.resetInProgress = false;
            this.activeModal.close();
        })
        .catch((error) => {
            this.resetInProgress = false;
            this.activeModal.dismiss(error);
        });
    }
}
