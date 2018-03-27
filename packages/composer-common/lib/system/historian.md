*HistorianRecord* is a system asset which holds information from network transactions. *HistorianRecord* has the *transactionId*, *transactionType*, *transactionInvoked*, *participantInvoking*, *identityUsed*, *eventsEmitted*, and *transactionTimestamp* properties.

```
asset HistorianRecord identified by transactionId {
  o String        transactionId
  o String        transactionType
  --> Transaction transactionInvoked
  --> Participant participantInvoking  optional
  --> Identity    identityUsed         optional
  o Event[]       eventsEmitted        optional
  o DateTime      transactionTimestamp
}
```
