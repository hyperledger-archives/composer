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
import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/markdown-fold';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/scroll/simplescrollbars';

@Component({
    selector: 'transaction-modal',
    templateUrl: './view-transaction.component.html',
    styleUrls: ['./view-transaction.component.scss'.toString()]
})

export class ViewTransactionComponent implements OnInit {

    @Input()
    transaction;
    transactionString = '';

    @Input()
    events = [];

    eventObjects = [];
    eventStrings = [];
    selectedEvent = {index: -1, event: null};
    displayEvents = {};

    isEvent = false;

    private codeConfig = {
        lineNumbers: true,
        lineWrapping: true,
        readOnly: true,
        mode: 'javascript',
        autofocus: true,
        extraKeys: {
            'Ctrl-Q': (cm) => {
                cm.foldCode(cm.getCursor());
            }
        },
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        scrollbarStyle: 'simple'
    };

    constructor(private clientService: ClientService,
                private activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        const serializer = this.clientService.getBusinessNetwork().getSerializer();

        let transactionObject = serializer.toJSON(this.transaction);
        this.transactionString = JSON.stringify(transactionObject, null, ' ');

        for (let i = 0; i < this.events.length; i++) {
            this.eventObjects.push(serializer.toJSON(this.events[i]));
            this.eventStrings.push(JSON.stringify(this.eventObjects[i], null, ' '));
        }
    }

    selectEvent(ev, i) {
        this.selectedEvent = {event: ev, index: i};

        if (!this.displayEvents.hasOwnProperty(i)) {
            this.displayEvents[i] = this.selectedEvent;
        } else {
            delete this.displayEvents[i];
        }
    }

    showTransaction() {
        this.isEvent = false;
    }

    showEvents() {
        this.isEvent = true;
    }

    showEvent(index) {
        return this.displayEvents.hasOwnProperty(index);
    }
}
