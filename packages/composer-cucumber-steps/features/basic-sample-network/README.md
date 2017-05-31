# Welcome to Hyperledger Composer!

This is the "Hello World" of Hyperledger Composer samples.

This sample defines a business network composed of a single asset type (`SampleAsset`), a single participant type (`SampleParticipant`), and a single transaction type (`SampleTransaction`).

`SampleAssets` are owned by a `SampleParticipant`, and the value property on a `SampleAsset` can be modified by submitting a `SampleTransaction`.

To get started inside Hyperledger Composer you can click the Test tab and create instances of `SampleAsset` and `SampleParticipant`. Make sure that the owner property on the `SampleAsset` refers to a `SampleParticipant` that you have created.

You can then submit a `SampleTransaction`, making sure that the asset property refers to an asset that you created earlier. After the transaction has been processed you should see that the value property on the asset has been modified.

The logic for updating the asset when a `SampleTransaction` is processed is written in `logic.js`.

Don't forget you can import more advanced samples into Hyperledger Composer using the Import/Replace button.

Have fun learning Hyperledger Composer!