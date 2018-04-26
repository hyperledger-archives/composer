*ParticipantTransaction* is a system transaction for a transaction which affects a participant. *ParticipantTransaction* is an **abstract**, meaning instances of it cannot be used. *ParticipantTransaction* has the *resources* property.

```
abstract transaction ParticipantTransaction extends RegistryTransaction {
  o Participant[] resources
}
```
