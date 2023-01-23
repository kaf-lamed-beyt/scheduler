const {
  createNodeMiddleware,
  createProbot,
} = require("@probot/adapter-aws-lambda-serverless");

const app = require("../../../demo");

module.exports = createNodeMiddleware(app, {
  probot: createProbot(),
  webhooksPath: "/api/github/webhooks",
});
