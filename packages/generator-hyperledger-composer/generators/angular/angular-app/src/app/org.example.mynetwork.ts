import {Asset} from './org.hyperledger.composer.system';
import {Participant} from './org.hyperledger.composer.system';
import {Transaction} from './org.hyperledger.composer.system';
import {Event} from './org.hyperledger.composer.system';
import {Asset} from './org.hyperledger.composer.system';
// export namespace org.example.mynetwork{
   export class User extends Participant {
      email: string;
   }
   export class SampleAsset extends Asset {
      assetId: string;
      value: string;
   }
   export class Test extends Asset {
      id: string;
   }
   export class ChangeAssetValue extends Transaction {
      newValue: string;
      relatedAsset: Asset;
      test: Test;
   }
// }
