/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
const moment = require("moment");

const BOT_USERNAME = "agba-merger";

module.exports = (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");

  app.on("issue_comment", async (context) => {
    const { payload } = context;

    if (
      payload.action === "opened" &&
      payload.pull_request.state === "opened"
    ) {
      const commentAuthor = payload.sender.login;
      const commentBody = payload.comment.body;
      const pullRequestNumber = payload.issue.number;
      const repoName = payload.repository.name;
      const repoOwner = payload.repository.owner.login;

      if (!commentBody.includes(`@${BOT_USERNAME} merge`)) {
        return;
      }

      const dateFormat = "YYYY-MM-DD";
      const scheduledDate = moment(
        commentBody.match(dateFormat)[0],
        dateFormat
      );
      if (!scheduledDate.isValid()) {
        context.github.issues.createComment({
          owner: repoOwner,
          repo: repoName,
          issue_number: pullRequestNumber,
          body: `@${commentAuthor} Invalid date format. Use YYYY-MM-DD.`,
        });
        return;
      }

      if (scheduledDate.isAfter(moment())) {
        context.github.issues.createComment({
          owner: repoOwner,
          repo: repoName,
          issue_number: pullRequestNumber,
          body: `@${commentAuthor} Merge scheduled for ${scheduledDate.format(
            dateFormat
          )}.`,
        });
      } else {
        context.github.pulls.merge({
          owner: repoOwner,
          repo: repoName,
          pull_number: pullRequestNumber,
        });
        context.github.issues.createComment({
          owner: repoOwner,
          repo: repoName,
          issue_number: pullRequestNumber,
          body: `@${commentAuthor} Pull request merged.`,
        });
      }
    }
  });
};
