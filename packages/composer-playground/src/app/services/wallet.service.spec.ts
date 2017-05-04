/* tslint:disable:no-unused-variable */
import { WalletService } from './wallet.service';

describe('WalletService', () => {

  let service: WalletService;

  beforeEach(() => {
    service = new WalletService();
  });

  /*
   * Unfortunately this is proving problematic. There seems to be an issue with
   * logger.js and webpack when testing. Although the log configuration does return
   * './winstonInjector.js' for the logger, it then fails to load:
   * 
   *     Error: Cannot find module "."
   * 
   * Accepting poor test coverage on this service for now.
   */
  describe('#getWallet', () => {

  });
});
