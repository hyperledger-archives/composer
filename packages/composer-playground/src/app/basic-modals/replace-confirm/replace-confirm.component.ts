import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'confirm',
    templateUrl: './replace-confirm.component.html',
    styleUrls: ['./replace-confirm.component.scss'.toString()]
})

export class ReplaceComponent {

    @Input() headerMessage: string = null;
    @Input() mainMessage: string = null;
    @Input() supplementaryMessage: string = null;
    @Input() resource: string = null;

    constructor(public activeModal: NgbActiveModal) {
    }
}
