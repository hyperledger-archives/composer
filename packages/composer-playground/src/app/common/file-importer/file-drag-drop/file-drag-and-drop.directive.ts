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
import { Directive, EventEmitter, HostListener, Output, Input } from '@angular/core';

@Directive({
    selector: '[fileDragDrop]',
})

export class FileDragDropDirective {

    @Output()
    public fileDragDropFileAccepted: EventEmitter<File> = new EventEmitter<File>();
    @Output()
    public fileDragDropFileRejected: EventEmitter<string> = new EventEmitter<string>();
    @Output()
    public fileDragDropDragOver: EventEmitter<string> = new EventEmitter<string>();
    @Output()
    public fileDragDropDragLeave: EventEmitter<string> = new EventEmitter<string>();

    @Input()
    public supportedFileTypes: string[] = [];
    @Input()
    maxFileSize: number = 0;

    @HostListener('dragenter', ['$event'])
    public onDragOver(event: Event): void {
        this.fileDragDropDragOver.emit('entered');

        this.preventAndStopEventPropagation(event);
    }

    @HostListener('dragexit', ['$event'])
    public onDragLeave(event: Event): void {
        this.fileDragDropDragLeave.emit('exited');
        this.preventAndStopEventPropagation(event);
    }

    @HostListener('drop', ['$event'])
    public onDrop(event: Event): void {
        let data = this.getDataTransferObject(event);

        // Get the file
        let droppedFile: File = data.files[0];

        let indexOfDot = droppedFile.name.lastIndexOf('.');
        let droppedFileType = droppedFile.name.slice(indexOfDot);

        if (this.supportedFileTypes.length > 0 && this.supportedFileTypes.indexOf(droppedFileType) < 0) {
            this.fileDragDropFileRejected.emit('file ' + droppedFile.name + ' has an unsupported file type');
        } else if (this.maxFileSize > 0 && this.maxFileSize < droppedFile.size) {
            this.fileDragDropFileRejected.emit('file ' + droppedFile.name + ' was too large');
        } else {
            this.fileDragDropFileAccepted.emit(droppedFile);
        }

        this.preventAndStopEventPropagation(event);

    }

    private preventAndStopEventPropagation(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
    }

    private getDataTransferObject(event: Event | any): DataTransfer {
        return event.dataTransfer ? event.dataTransfer : event.originalEvent.dataTransfer;
    }
}
