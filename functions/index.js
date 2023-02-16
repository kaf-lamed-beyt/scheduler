const {
  createLambdaFunction,
  createProbot,
} = require("@probot/adapter-aws-lambda-serverless");
const app = require("../index");

module.exports.handler = createLambdaFunction(app, {
  probot: createProbot(),
});
