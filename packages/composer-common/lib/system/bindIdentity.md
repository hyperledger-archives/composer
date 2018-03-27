*BindIdentity* is a system transaction which binds an issued identity to a participant. *BindIdentity* contains a *participant* property, specifying a relationship to a participant. 

```
transaction BindIdentity {
    --> Participant participant
    o String certificate
}
```
