import { Injectable } from '@angular/core';

import { FileWallet } from 'composer-common';

@Injectable()
export class WalletService {

    private fileWallets: Map<string, FileWallet> = new Map<string, FileWallet>();

    getWallet(name: string) {
        if (!this.fileWallets.has(name)) {
            let directory = `/wallets/${name}`;
            let fileWallet = new FileWallet({
                directory: directory
            });
            this.fileWallets.set(name, fileWallet);
        }
        return this.fileWallets.get(name);
    }

    removeFromWallet(name: string, id: string): Promise<any> {
        let wallet = this.getWallet(name);
        return wallet.remove(id);
    }
}
