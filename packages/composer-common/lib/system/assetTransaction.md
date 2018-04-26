*AssetTransaction* is a system transaction for a transaction which affects an asset. *AssetTransaction* is an **abstract**, meaning instances of it cannot be used. *AssetTransaction* has the *resources* property.

```
abstract transaction AssetTransaction extends RegistryTransaction {
   o Asset[] resources
}
```
