const {
  createLambdaFunction,
  createProbot,
} = require("@probot/adapter-aws-lambda-serverless");
const appFn = require("../index");

exports.handler = createLambdaFunction(appFn, {
  probot: createProbot(),
});
