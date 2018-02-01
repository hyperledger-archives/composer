/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'file-importer',
    templateUrl: './file-importer.component.html',
    styleUrls: ['./file-importer.component.scss'.toString()]
})

export class FileImporterComponent {

    @Output()
    public fileAccepted: EventEmitter<File> = new EventEmitter<File>();

    @Output()
    public fileRejected: EventEmitter<string> = new EventEmitter<string>();

    @Input()
    public expandInput: boolean = false;

    @Input()
    public svgName: string = '#icon-BNA_Upload';

    @Input()
    public maxFileSize: number = 0;

    @Input()
    public supportedFileTypes: string[] = [];

    onFileChange($event) {
        let droppedFile: File = $event.target.files[0];

        let indexOfDot = droppedFile.name.lastIndexOf('.');
        let droppedFileType = droppedFile.name.slice(indexOfDot);

        if (this.supportedFileTypes.length > 0 && this.supportedFileTypes.indexOf(droppedFileType) < 0) {
            this.fileRejected.emit('file ' + droppedFile.name + ' has an unsupported file type');
        } else if (this.maxFileSize > 0 && this.maxFileSize < droppedFile.size) {
            this.fileRejected.emit('file ' + droppedFile.name + ' was too large');
        } else {
            this.fileAccepted.emit(droppedFile);
        }
    }
}
