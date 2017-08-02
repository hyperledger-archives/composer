import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';
import { TransactionService } from '../../services/transaction.service';
import { InitializationService } from '../../services/initialization.service';

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

export class ViewTransactionComponent implements OnInit, OnDestroy {

    transaction = {};
    transactionString = '';

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
                private initializationService: InitializationService,
                private transactionService: TransactionService,
                public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        return this.initializationService.initialize()
            .then(() => {
                const serializer = this.clientService.getBusinessNetwork().getSerializer();

                this.transactionString = JSON.stringify(serializer.toJSON(this.transaction), null, ' ');

                this.events = this.events;

                for (let i = 0; i < this.events.length; i++) {
                    this.eventObjects.push(serializer.toJSON(this.events[i]));
                    this.eventStrings.push(JSON.stringify(this.eventObjects[i], null, ' '));
                }
            });
    }

    ngOnDestroy() {
        // Make sure the transaction service is reset
        this.transactionService.reset(null, null);
    }

    selectEvent(ev, i) {
        this.selectedEvent = { event: ev, index: i };

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
