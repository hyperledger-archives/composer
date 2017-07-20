import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'identity-card',
    templateUrl: './identity-card.component.html',
    styleUrls: [
        './identity-card.component.scss'.toString()
    ]
})

export class IdentityCardComponent {

    @Input()
    identity: any;

    @Input()
    preview: boolean = false;

    @Output()
    onConnect: EventEmitter<string> = new EventEmitter<string>();

    @Output()
    onDismiss: EventEmitter<string> = new EventEmitter<string>();

    @Output()
    onDelete: EventEmitter<string> = new EventEmitter<string>();

    @Output()
    onExport: EventEmitter<string> = new EventEmitter<string>();

    connect() {
        this.onConnect.emit(this.identity.userId);
    }

    dismiss() {
        this.onDismiss.emit(this.identity.userId);
    }

    delete() {
        this.onDelete.emit(this.identity.userId);
    }

    export() {
        this.onExport.emit(this.identity.userId);
    }

    getInitials<String>() {
        let result;
        let userId = this.identity.userId;
        let regexp = /^(\S)\S*\s*(\S?)/i;
        let matches = regexp.exec(userId);

        if (matches) {
            result = matches.slice(1, 3).join('');
        }

        return result ? result : ':)';
    }
}
