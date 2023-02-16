const {
  createLamdaFunction,
  createProbot,
} = require("@probot/adapter-aws-lambda-serverless");
const app = require("../../index");

module.exports.handler = createLamdaFunction(app, {
  probot: createProbot(),
});
