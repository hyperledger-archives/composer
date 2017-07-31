import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'import-error',
    templateUrl: './import-error.component.html',
    styleUrls: ['./import-error.component.scss'.toString()]
})

export class ImportErrorComponent {

    @Input() errorMessage: string = null;

    constructor(public activeModal: NgbActiveModal) {
    }
}
