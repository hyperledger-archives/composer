The base *event* is implicitly extended by all other events. *Event* is an **abstract** meaning that no instances of it can be created, however, it does contain the *eventId* and *timestamp* properties, which are extended to all other events.

```
abstract event Event identified by eventId {
  o String eventId
  o DateTime timestamp
}
```
