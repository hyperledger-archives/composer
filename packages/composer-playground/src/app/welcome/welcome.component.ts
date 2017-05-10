import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'welcome-modal',
    templateUrl: './welcome.component.html',
    styleUrls: ['./welcome.component.scss'.toString()]
})
export class WelcomeComponent {

    constructor(public activeModal: NgbActiveModal) {

    }
}
