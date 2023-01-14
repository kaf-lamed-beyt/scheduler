const {
  createNodeMiddleware,
  createProbot,
} = require("@probot/adapter-aws-lambda-serverless");

const app = require("../../../index");

module.exports = createNodeMiddleware(app, {
  probot: createProbot(),
  webhooksPath: "/api/github/webhooks",
});
