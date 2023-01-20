/**
 * This is the main entrypoint to my Probot app
 * @param {import('probot').Probot} app
 */
const cron = require("node-cron");
const schedule = require("node-schedule");
const moment = require("moment");
const APP_NAME = "agba-merger";

module.exports = (app) => {
  app.on("issue_comment.created", async (context) => {
    try {
      // Extract the username, "merge" keyword, and date format from the comment body

      const COMMENT = context.payload.comment.body;
      const USERNAME = context.payload.comment.user.login;
      const MERGE_KEYWORD = "merge";

      const scheduledDateMatch = COMMENT.match(/ (\d{4}-\d{2}-\d{2})/);

      if (
        COMMENT.includes(`@${APP_NAME}`) &&
        COMMENT.includes(MERGE_KEYWORD) &&
        scheduledDateMatch
      ) {
        // Extract the scheduled date from the comment and parse it using moment
        const scheduledDate = moment(scheduledDateMatch[1]);
        // Check if the scheduled date is in the future
        if (scheduledDate.isAfter(moment())) {
          // Check if the user has permission to merge pull requests in the repository
          // with the author's association to the repository.
          const AUTHOR_ROLE = context.payload.issue.author_association;

          if (AUTHOR_ROLE === "OWNER" || AUTHOR_ROLE === "COLLABORATOR") {
            // Respond with a comment confirming that the merge request has been scheduled
            await context.octokit.issues.createComment(
              context.issue({
                body: `Hi @${USERNAME}, your merge request has been scheduled for ${scheduledDate.format(
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
                body: `Hi @${USERNAME}, you do not have permission to merge pull requests in this repository`,
              })
            );
          }
        }
      }
      if (
        COMMENT.includes(APP_NAME) &&
        COMMENT.includes(!MERGE_KEYWORD) &&
        COMMENT.includes(!scheduledDateMatch)
      ) {
        await context.octokit.issues.createComment(
          context.issue({
            body: `Hi @${USERNAME}, you need to pass the 'merge' keyword and the date you'd want this pull request to be merged`,
          })
        );
      }
    } catch (error) {
      console.error(error);

      await context.octokit.issues.createComment(
        context.issue({
          body: `Hi @${USERNAME}, something went wrong while trying to schedule your merge request. Please try again later or contact an admin for assistance.`,
        })
      );
    }
  });
};

const scheduleMergeRequest = async (context, scheduledDate) => {
  try {
    const USERNAME = context.payload.comment.user.login;
    const PR_STATE = context.payload.issue.state;
    const ISSUE_NUMBER = context.payload.issue.number;

    // Schedule the merge request
    schedule.scheduleJob(scheduledDate.toDate(), async () => {
      if (PR_STATE === "open") {
        // Merge the pull request
        await context.octokit.pulls.merge({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          pull_number: ISSUE_NUMBER,
        });

        await context.octokit.issues.createComment(
          context.issue({
            body: `Hi @${USERNAME}, your pull request was merged at ${moment().format()}`,
          })
        );
      }
    });
  } catch (error) {
    console.error(error);

    await context.octokit.issues.createComment(
      context.issue({
        body: `Hi @${USERNAME}, something went wrong while trying to schedule your merge request. Please try again later or contact an admin for assistance.`,
      })
    );
  }
};
