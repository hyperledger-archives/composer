// export namespace org.hyperledger.composer.system{
   export abstract class Asset {
   }
   export abstract class Participant {
   }
   export abstract class Transaction {
      transactionId: string;
      timestamp: Date;
   }
   export abstract class Event {
      eventId: string;
      timestamp: Date;
   }
   export abstract class Registry extends Asset {
      registryId: string;
      name: string;
      type: string;
      system: boolean;
   }
   export class AssetRegistry extends Registry {
   }
   export class ParticipantRegistry extends Registry {
   }
   export class TransactionRegistry extends Registry {
   }
   export class Network extends Asset {
      networkId: string;
      runtimeVersion: string;
   }
   export class NetworkAdmin extends Participant {
      participantId: string;
   }
   export class HistorianRecord extends Asset {
      transactionId: string;
      transactionType: string;
      transactionInvoked: Transaction;
      participantInvoking: Participant;
      identityUsed: Identity;
      eventsEmitted: Event[];
      transactionTimestamp: Date;
   }
   export abstract class RegistryTransaction extends Transaction {
      targetRegistry: Registry;
   }
   export abstract class AssetTransaction extends RegistryTransaction {
      resources: Asset[];
   }
   export abstract class ParticipantTransaction extends RegistryTransaction {
      resources: Participant[];
   }
   export class AddAsset extends AssetTransaction {
   }
   export class UpdateAsset extends AssetTransaction {
   }
   export class RemoveAsset extends AssetTransaction {
      resourceIds: string[];
   }
   export class AddParticipant extends ParticipantTransaction {
   }
   export class UpdateParticipant extends ParticipantTransaction {
   }
   export class RemoveParticipant extends ParticipantTransaction {
      resourceIds: string[];
   }
   export enum IdentityState {
      ISSUED,
      BOUND,
      ACTIVATED,
      REVOKED,
   }
   export class Identity extends Asset {
      identityId: string;
      name: string;
      issuer: string;
      certificate: string;
      state: IdentityState;
      participant: Participant;
   }
   export class IssueIdentity extends Transaction {
      participant: Participant;
      identityName: string;
   }
   export class BindIdentity extends Transaction {
      participant: Participant;
      certificate: string;
   }
   export class ActivateCurrentIdentity extends Transaction {
   }
   export class RevokeIdentity extends Transaction {
      identity: Identity;
   }
   export class StartBusinessNetwork extends Transaction {
      logLevel: string;
      bootstrapTransactions: Transaction[];
   }
   export class ResetBusinessNetwork extends Transaction {
   }
   export class SetLogLevel extends Transaction {
      newLogLevel: string;
   }
// }
