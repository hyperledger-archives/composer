import { Component } from '@angular/core';
import { ActiveDrawer, DrawerService } from '../../common/drawer';

import { IdCard } from 'composer-common';
import { IdentityCardService } from '../../services/identity-card.service';

@Component({
    selector: 'import-identity',
    templateUrl: './import-identity.component.html',
    styleUrls: ['./import-identity.component.scss'.toString()]
})
export class ImportIdentityComponent {

    private importInProgress: boolean = false;

    private expandInput: boolean = false;
    private maxFileSize: number = 52428800;
    private supportedFileTypes: string[] = ['.card'];

    private identityCard: IdCard;
    private cardName: string;
    private cardNameValid: boolean = true;

    constructor(public activeDrawer: ActiveDrawer,
                public drawerService: DrawerService,
                private identityCardService: IdentityCardService) {
    }

    removeFile() {
        this.expandInput = false;
        this.identityCard = null;
    }

    private fileDetected() {
        this.expandInput = true;
    }

    private fileLeft() {
        this.expandInput = false;
    }

    private fileAccepted(file: File) {
        let fileReader = new FileReader();
        fileReader.onload = () => {
            let dataBuffer = Buffer.from(fileReader.result);

            this.readCard(dataBuffer);
        };

        fileReader.readAsArrayBuffer(file);
    }

    private readCard(cardData: Buffer) {
        IdCard.fromArchive(cardData).then((card) => {
            this.expandInput = true;
            this.identityCard = card;
        }).catch((reason) => {
            this.fileRejected(reason.message || 'Could not read business network card');
        });
    }

    private fileRejected(reason: string) {
        this.activeDrawer.dismiss(reason);
    }

    private import() {
        return this.identityCardService.addIdentityCard(this.identityCard, this.cardName)
            .then((cardRef) => {
                this.activeDrawer.close(cardRef);
            })
            .catch((error) => {
                if (error.message.startsWith('Card already exists: ')) {
                    this.cardNameValid = false;
                } else {
                    this.activeDrawer.dismiss(error);
                }
            });
    }

    private setCardName(name) {
        if (this.cardName !== name) {
            this.cardName = name;
            this.cardNameValid = true;
        }
    }
}
