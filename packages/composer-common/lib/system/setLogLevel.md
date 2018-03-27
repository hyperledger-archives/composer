*SetLogLevel* is a system transaction which sets the logging level for the business network. The possible logging levels can be found in the [problem diagnosis documentation](../problems/diagnostics.html).

```
transaction SetLogLevel {
  o String newLogLevel
}
```
