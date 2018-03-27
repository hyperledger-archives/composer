*RegistryTransaction* is a system transaction for a transaction which affects a registry. *RegistryTransaction* is an **abstract**, meaning instances of it cannot be used. *RegistryTransaction* has the *targetRegistry* property, which contains a relationship to a registry.

```
abstract transaction RegistryTransaction {
  --> Registry targetRegistry
}
```
