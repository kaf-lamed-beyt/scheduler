# agba-merger

> A GitHub App built with [Probot](https://github.com/probot/probot) that A GitHub bot that helps you publish any feature in your project   or article in your developer blog, on a scheduled date/day

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

[ISC](LICENSE) © 2023 kaf-lamed-beyt
