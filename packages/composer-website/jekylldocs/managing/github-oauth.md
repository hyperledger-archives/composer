---
layout: default
title: Enabling Playground OAuth with GitHub
category: tasks
section: managing
sidebar: sidebars/managing.md
excerpt: By [**enabling OAuth with GitHub**](../managing/github-oauth.html), you avoid an error if the GitHub rate limit is hit.
index-order: 5
---

# Enabling Playground OAuth with GitHub

To enable importing of samples into a local instance of Playground without receiving an error when the rate limit is hit follow these steps.

1. Go to [GitHub OAuth Applications](https://github.com/settings/developers).
2. Register a new application.
    - The `Authorization callback URL` should be set to `localhost:<port>/github`.
3. On the command line navigate to the `composer-playground-ui` config directory.

    ```
    cd composer/packages/composer-playground-ui/config
    ```  
4. Copy the file.

    ```
    cp .env.sample .env
    ```
5. Open the `.env` file and set the `CLIENT_ID` and `CLIENT_SECRET` to the values that were given when you registered the application.
6. (optional) The `port` which the `composer-playground-ui` can also be set by setting the `PORT` value in the `.env` file.
