# Trade Network

> This Business Network illustrates commodity trading.

This business network defines:

**Participant**
`Trader`

**Asset**
`Commodity`

**Transaction(s)**
`Transaction`

**Event**
`TradeNotification `

To test this Business Network Definition in the **Test** tab:

Create two `Trader` participants:

```
{
  "$class": "org.acme.trading.Trader",
  "tradeId": "TRADER1",
  "firstName": "Jenny",
  "lastName": "Jones"
}
```

```
{
  "$class": "org.acme.trading.Trader",
  "tradeId": "TRADER2",
  "firstName": "Amy",
  "lastName": "Williams"
}
```

Create a `Commodity` asset:

```
{
  "$class": "org.acme.trading.Commodity",
  "tradingSymbol": "ABC",
  "description": "Test commodity",
  "mainExchange": "Euronext",
  "quantity": 72.297,
  "owner": "resource:org.acme.trading.Trader#TRADER1"
}
```

Submit a `Trade` transaction:

```
{
  "$class": "org.acme.trading.Trade",
  "commodity": "resource:org.acme.trading.Commodity#ABC",
  "newOwner": "resource:org.acme.trading.Trader#TRADER2"
}
```

After submitting this transaction, you should now see the transaction in the transaction registry. As a result, the owner of the commodity `ABC` should now be owned `TRADER2` in the Asset Registry.

Congratulations!

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.