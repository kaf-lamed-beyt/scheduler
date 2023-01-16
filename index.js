/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
const moment = require("moment");

module.exports = (app) => {
  app.on("issue_comment.created", async (context) => {
    // Extract the username, "merge" keyword, and date format from the comment body
    const comment = context.payload.comment.body;
    const username = context.payload.comment.user.login;
    const mergeKeyword = "merge";
    const dateFormat = /\d{4}-\d{2}-\d{2}/;

    if (
      comment.includes(`@${app.appName}`) &&
      comment.includes(mergeKeyword) &&
      comment.match(dateFormat)
    ) {
      // Extract the scheduled date from the comment and parse it using moment
      const scheduledDate = moment(comment.match(dateFormat)[0]);
      // Check if the scheduled date is in the future
      if (scheduledDate.isAfter(moment())) {
        // Check if the user has permission to merge pull requests in the repository
        const repo = context.payload.repository;
        const { data: collaborators } =
          await context.octokit.repos.listCollaborators({
            owner: repo.owner.login,
            repo: repo.name,
          });
        const hasPermission = collaborators.find(
          (collaborator) => collaborator.login === username
        );
        if (hasPermission) {
          // Respond with a comment confirming that the merge request has been scheduled
          await context.octokit.issues.createComment(
            context.issue({
              body: `Hey @${username}, your merge request has been scheduled for ${scheduledDate.format(
                "YYYY-MM-DD"
              )}`,
            })
          );
          // Schedule the merge request
          scheduleMergeRequest(context, scheduledDate);
        } else {
          // Respond with a comment telling the user they do not have permission
          await context.octokit.issues.createComment(
            context.issue({
              body: `Hey @${username}, you do not have permission to merge pull requests in this repository`,
            })
          );
        }
      } else {
        await context.octokit.issues.createComment(
          context.issue({
            body: `Hey @${username}, the date is not in the future.`,
          })
        );
      }
    }
  });

  const scheduleMergeRequest = async (context, scheduledDate) => {
    var waitTime = scheduledDate.diff(moment());
    setTimeout(async () => {
      // Check if the pull request is still open
      const pr = context.payload.pull_request;
      if (pr.state === "open") {
        // Merge the pull request
        await context.octokit.pulls.merge(context.pullRequest({}));
        console.log("Merged at :", moment().format());
      }
    }, waitTime);
  };
};
