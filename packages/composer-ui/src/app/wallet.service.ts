import { Injectable } from '@angular/core';

import { FileWallet } from '@ibm/concerto-common';

@Injectable()
export class WalletService {

  private fileWallets: Map<string, FileWallet> = new Map<string, FileWallet>();

  constructor() {
  }

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

}
