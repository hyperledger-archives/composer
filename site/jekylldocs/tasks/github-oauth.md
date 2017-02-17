---
layout: default
title: Task - Enable OAuth with Github
category: tasks
sidebar: sidebars/tasks.md
excerpt: How to enable OAuth with Github
---

# Enable OAuth with Github

To enable importing of samples without receiving an error when the rate limit is hit follow these steps.

1. Go to [Github OAuth Applications](https://github.com/settings/developers).
2. Register a new application.
3. On the command line navigate to the `composer-connector-server` config directory.
 
    ```
    cd fabric-composer/packages/composer-connector-server/config
    ```  
4. Copy the file.

    ```
    cp .env.sample .env
    ```
5. Open the `.env` file and set the `CLIENT_ID` and `CLIENT_SECRET` to the values that were given when you registered the application.
6. (optional) The `port` which the `composer-connector-server` can also be set by setting the `PORT` value in the `.env` file.
