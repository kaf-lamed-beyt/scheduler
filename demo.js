/**
 * This is the main entrypoint to my Probot app
 * @param {import('probot').Probot} app
 */

const APP_NAME = "agba-merger";
const MERGE_KEYWORD = "please merge this pull request";

module.exports = (app) => {
  app.on("issue_comment.created", async (context) => {
    try {
      const COMMENT = context.payload.comment.body;
      const USERNAME = context.payload.comment.user.login;
      const AUTHOR_ROLE = context.payload.issue.author_association;
      const ISSUE_NUMBER = context.payload.issue.number;

      if (COMMENT.includes(`@${APP_NAME}`) && COMMENT.includes(MERGE_KEYWORD)) {
        if (AUTHOR_ROLE === "OWNER" || AUTHOR_ROLE === "COLLABORATOR") {
          await context.octokit.issues.createComment(
            context.issue({
              body: `Hi @${USERNAME}, your merge request is being processed...`,
            })
          );
          const pull_request = await context.github.pulls.get({
            owner: context.payload.repository.owner.login,
            repo: context.payload.repository.name,
            pull_number: ISSUE_NUMBER,
          });
          if (pull_request.data.state === "open") {
            const merge = await context.github.pulls.merge({
              owner: context.payload.repository.owner.login,
              repo: context.payload.repository.name,
              pull_number: ISSUE_NUMBER,
            });
            if (merge.status === 204) {
              await context.octokit.issues.createComment(
                context.issue({
                  body: `Hi @${USERNAME}, your pull request was successfully merged`,
                })
              );
            }
          } else {
            await context.octokit.issues.createComment(
              context.issue({
                body: `Hi @${USERNAME}, your pull request could not be merged as it is not in the open state`,
              })
            );
          }
        } else {
          await context.octokit.issues.createComment(
            context.issue({
              body: `Hi @${USERNAME}, you do not have permission to merge pull requests in this repository`,
            })
          );
        }
      }
    } catch (error) {
      console.error(error);
      await context.octokit.issues.createComment(
        context.issue({
          body: `Hi @${USERNAME}, something went wrong while trying to merge your pull request. Please try again later or contact an admin for assistance.`,
        })
      );
    }
  });
};
