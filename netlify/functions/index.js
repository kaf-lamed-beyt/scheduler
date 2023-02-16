const {
  createLambdaFunction,
  createProbot,
} = require("@probot/adapter-aws-lambda-serverless");
const appFn = require("../../index");

module.exports.handler = createLambdaFunction(appFn, {
  probot: createProbot(),
});
