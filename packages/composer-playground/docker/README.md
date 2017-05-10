# What is Hyperledger Composer?

You can use Hyperledger Composer to easily define your business network, creating and tracking assets and performing transactions. Business networks represent an economic network made up of participants, assets, and the transactions that are performed between them. Assets are tangible or intangible goods, services, or property, and are stored in registries. Transactions are operations which may transform, create, and transfer assets or participants. Participants can interact with multiple business networks and maintain assets as they move between them using set identities.

Applications can consume the data from business networks, providing end users with simple and controlled access points to the business network. Business networks can also be integrated with existing systems to create assets, transactions, and participants based on existing data.

Hyperledger Composer requires and exploits the existing Hyperledger Fabric blockchain technology, using the blockchain consensus protocol to ensure that transactions are validated by business network participants.

You can find more information regarding Hyperledger Composer on the web site: [https://hyperledger.github.io/composer/](https://hyperledger.github.io/composer/)

# How to use this image

Hyperledger Composer offers tutorials and getting started guides designed to help you take your first steps with Hyperledger Composer. We recommend that new users follow the tutorials before proceeding to install this image: [https://hyperledger.github.io/composer/tutorials/tutorialindex.html](https://hyperledger.github.io/composer/tutorials/tutorialindex.html)

You can run a local version of the Hyperledger Composer Playground using this image by running the following command:

`docker run --name composer-playground --publish 8080:8080 --detach hyperledger/composer-playground`

Once the container has started, you can access the Hyperledger Composer Playground in a web browser by using this link: [http://localhost:8080/](http://localhost:8080/)

If you finish using the Hyperledger Composer Playground, and wish to delete the container, then run the following command:

`docker rm --force composer-playground`

# License

View [license information](https://github.com/hyperledger/composer/blob/master/LICENSE.txt) for the software contained in this image.

# Feedback and support

If you have any questions about using this image, Hyperledger Composer Playground, or Hyperledger Composer in general, then please raise a question on Stack Overflow using the `hyperledger-composer` tag: [http://stackoverflow.com/questions/tagged/hyperledger-composer](http://stackoverflow.com/questions/tagged/hyperledger-composer)

If you find an issue with this image, please raise a GitHub issue, ensuring that you include all relevant information in order for the team to reproduce the problem, on the main GitHub repository: [https://github.com/hyperledger/composer](https://github.com/hyperledger/composer)

You can speak to the Hyperledger Composer team on the Hyperledger RocketChat in the `#composer` channel: [http://chat.hyperledger.org](http://chat.hyperledger.org)

You can also tweet the Hyperledger Composer team by using the `#Hyperledger #Composer` hashtags: [https://twitter.com/search?q=%23Hyperledger%20%23Composer&src=typd](https://twitter.com/search?q=%23Hyperledger%20%23Composer&src=typd)
