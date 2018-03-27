*IdentityState* is an enumerated list of the four states an *Identity* can hold. The identity lifecycle is as follows, first an identity is **issued**, then **bound** to a participant. When that identity is first used it becomes **activated** and will remain activated until it is **revoked**.

```
enum IdentityState {
    o ISSUED
    o BOUND
    o ACTIVATED
    o REVOKED
}
```
