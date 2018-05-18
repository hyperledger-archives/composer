# Welcome to Hyperledger Composer!

This is the "Hello World" of Hyperledger Composer samples.

This sample defines a business network composed of a single asset type (`SampleAsset`), a single participant type (`SampleParticipant`), a single transaction type (`SampleTransaction`), and a single event type (`SampleEvent`).

`SampleAssets` are owned by a `SampleParticipant`, and the value property on a `SampleAsset` can be modified by submitting a `SampleTransaction`. The `SampleTransaction` emits a `SampleEvent` that notifies applications of the old and new values for each modified `SampleAsset`.

To get started inside Hyperledger Composer you can click the Test tab and create instances of `SampleAsset` and `SampleParticipant`. Make sure that the owner property on the `SampleAsset` refers to a `SampleParticipant` that you have created.

You can then submit a `SampleTransaction`, making sure that the asset property refers to an asset that you created earlier. After the transaction has been processed you should see that the value property on the asset has been modified, and that a `SampleEvent` has been emitted.

The logic for updating the asset when a `SampleTransaction` is processed is written in `sample.js`.

Don't forget that you can import more advanced samples into Hyperledger Composer using the Import/Replace button.

Have fun learning Hyperledger Composer!

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.