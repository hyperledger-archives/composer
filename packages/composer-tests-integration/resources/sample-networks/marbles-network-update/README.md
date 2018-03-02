# Marbles Network

> This is an interactive and distributed, marble trading demo. List marbles for sale and exchange marbles between participants.

This business network defines:

**Participant**
`Player`

**Asset**
`Marble`

**Transaction**
`TradeMarble`

`Player` participants are able to have `Marble` assets and trade these with `TradeMarble` transaction.

To test this Business Network Definition in the **Test** tab:

Create two `Player` participant:

```
{
  "$class": "org.hyperledger_composer.marbles.Player",
  "email": "memberA@acme.org",
  "firstName": "Jenny",
  "lastName": "Jones"
}
```

```
{
  "$class": "org.hyperledger_composer.marbles.Player",
  "email": "memberB@acme.org",
  "firstName": "Billy",
  "lastName": "Thompson"
}
```

Create a `Marble` asset:

```
{
  "$class": "org.hyperledger_composer.marbles.Marble",
  "marbleId": "marbleId:1234",
  "size": "SMALL",
  "color": "BLUE",
  "owner": "resource:org.hyperledger_composer.marbles.Player#email:memberA@acme.org"
}
```

Submit a `Transaction` transaction:

```
{
  "$class": "org.hyperledger_composer.marbles.TradeMarble",
  "marble": "resource:org.hyperledger_composer.marbles.Marble#marbleId:1234",
  "newOwner": "resource:org.hyperledger_composer.marbles.Player#email:memberB@acme.org"
}
```

This transaction has transferred `marbleId:1234` from `memberA@acme.org` to `memberB@acme.org`.

Congratulations!
