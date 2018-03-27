*Identity* is a system asset which is related to a participant. 

```
asset Identity identified by identityId {
    o String identityId
    o String name
    o String issuer
    o String certificate
    o IdentityState state
    --> Participant participant
}
```
