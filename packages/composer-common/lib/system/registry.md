The base *registry* is implicitly extended by all other registries. *Registry* is an **abstract** meaning that no instances of it can be created. All registries must have a *registryId*, a *name*, a *type*, and a boolean *system* property defining whether it is a system registry.

```
abstract asset Registry identified by registryId {
  o String registryId
  o String name
  o String type
  o Boolean system
}
```
