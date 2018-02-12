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
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EditorFile } from '../../services/editor-file';

@Component({
    selector: 'delete-confirm',
    templateUrl: './delete-confirm.component.html',
    styleUrls: ['./delete-confirm.component.scss'.toString()]
})

export class DeleteComponent implements OnInit {
    @Input() deleteFile: EditorFile;
    @Input() fileType: string = null;
    @Input() fileName: string = null;
    @Input() action: string = null;
    @Input() headerMessage: string = null;
    @Input() deleteMessage: string = null;
    @Input() confirmButtonText: string = null;
    @Input() deleteFrom: string = null;

    constructor(public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        if (!this.fileName && !this.deleteFile) {
            throw new Error('either fileName or deleteFile should be specified');
        } else if (this.fileName && this.deleteFile) {
            throw new Error('only one of fileName or deleteFile should be specified');
        } else if (this.deleteFile) {
            this.fileName = this.deleteFile.getDisplayId();

            if (this.deleteFile.isModel()) {
                this.fileType = 'Model File';
            } else if (this.deleteFile.isScript()) {
                this.fileType = 'Script File';
            } else {
                this.fileType = 'File';
            }
        }
    }
}
