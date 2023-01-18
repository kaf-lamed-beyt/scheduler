# agba-merger

> A GitHub bot that helps you publish any feature in your project or article in your developer blog, on a scheduled date/day

![agba merger](/public/img/agba-merger-prompt.png)

## Usage

To use this bot, you'll have to [install it from GitHub's Marketplace](https://github.com/marketplace/agba-merger). Make sure you give it access to the scopes it is requesting for.

When you have a pull request that you want to schedule with the help of the bot, simply call its attention to that PR by typing the following in the PR's comment:

```md
"Yo! **@agba-merger**, please **merge** this pull request on **2023-01-22**"
```

You can choose to construct this sentence in any manner that seems appropriate to you. The keywords you shouldn't leave out are the name of the bot **@agba-merger**, the **merge**, and your date in **"YYYY-MM-DD** format.

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t agba-merger .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> agba-merger
```

## Contributing

If you have suggestions for how agba-merger could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2023 kaf-lamed-beyt
