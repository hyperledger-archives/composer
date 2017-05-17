import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'file-importer',
    templateUrl: './file-importer.component.html',
    styleUrls: ['./file-importer.component.scss'.toString()]
})

export class FileImporterComponent {

    @Output()
    public dragFileAccepted: EventEmitter<File> = new EventEmitter<File>();

    @Input()
    public expandInput: boolean = false;

    @Input()
    public svgName: string = '#icon-BNA_Upload';

    onFileChange($event) {
        let file: File = $event.target.files[0];

        this.dragFileAccepted.emit(file);
    }

}
