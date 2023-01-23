/**
 * @param {import('probot').Probot} app
 */

const moment = require("moment");
const APP_NAME = "agba-merger";
const MERGE_KEYWORD = "merge";

let ERROR_MESSAGE_STATE = false;

module.exports = (app) => {
  app.on("issue_comment.created", async (context) => {
    try {
      const COMMENT = context.payload.comment.body;
      const USERNAME = context.payload.comment.user.login;
      const AUTHOR_ROLE = context.payload.issue.author_association;
      const ISSUE_NUMBER = context.issue.number;

      if (
        COMMENT.includes(`@${APP_NAME}`) &&
        COMMENT.includes(MERGE_KEYWORD)
      ) {
        if (AUTHOR_ROLE === "OWNER" || AUTHOR_ROLE === "COLLABORATOR") {
          await context.octokit.pulls.merge({
            owner: context.payload.repository.owner.login,
            repo: context.payload.repository.name,
            pull_number: ISSUE_NUMBER,
          });

          await context.octokit.issues.createComment(
            context.issue({
              body: `Hi @${USERNAME}, your merge request has been successfully merged`,
            })
          );
        } else {
          await context.octokit.issues.createComment(
            context.issue({
              body: `Hi @${USERNAME}, you do not have permission to merge pull requests in this repository`,
            })
          );
        }
      }

      if (
        !COMMENT.includes(MERGE_KEYWORD)
      ) {
        await context.octokit.issues.createComment(
          context.issue({
            body: `Hi @${USERNAME}, you need to pass the "merge" keyword  to merge the pull request`,
          })
        );
      }
    } catch (error) {
      console.error(error);

      await context.octokit.issues.createComment(
        context.issue({
          body: `@${USERNAME}, something went wrong while I tried merging your pull request. Please try again later or contact an admin for assistance.`,
        })
      );
    }
  });
};
