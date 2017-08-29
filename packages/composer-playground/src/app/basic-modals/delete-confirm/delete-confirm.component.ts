import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'confirm',
    templateUrl: './delete-confirm.component.html',
    styleUrls: ['./delete-confirm.component.scss'.toString()]
})

export class DeleteComponent implements OnInit {
    @Input() deleteFile: any;

    public fileType: string = null;
    public fileName: string = null;
    public action: string = null;

    constructor(public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        if (!this.fileName) {
            this.fileName = this.deleteFile.displayID;

            if (this.deleteFile.model) {
                this.fileType = 'Model File';
            } else if (this.deleteFile.script) {
                this.fileType = 'Script File';
            } else {
                this.fileType = 'File';
            }
        }
    }
}
