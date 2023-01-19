/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
const cron = require("node-cron");
const moment = require("moment");
const appName = "agba-merger";

module.exports = (app) => {
  app.on("issue_comment.created", async (context) => {
    // Extract the username, "merge" keyword, and date format from the comment body
    const comment = context.payload.comment.body;
    const username = context.payload.comment.user.login;
    const mergeKeyword = "merge";
    const dateFormat = /\d{4}-\d{2}-\d{2}/;

    const scheduledDateMatch = comment.match(/ (\d{4}-\d{2}-\d{2})/);

    if (
      comment.includes(`@${appName}`) &&
      comment.includes(mergeKeyword) &&
      scheduledDateMatch
    ) {
      // Extract the scheduled date from the comment and parse it using moment
      const scheduledDate = moment(scheduledDateMatch[1]);
      // Check if the scheduled date is in the future
      if (scheduledDate.isAfter(moment())) {
        // Check if the user has permission to merge pull requests in the repository
        // with the author's association to the repository.
        const {
          payload: {
            issue: { author_association },
          },
        } = context;

        if (author_association === "OWNER" || "COLLABORATOR") {
          // Respond with a comment confirming that the merge request has been scheduled
          await context.octokit.issues.createComment(
            context.issue({
              body: `Hi @${username}, your merge request has been scheduled for ${scheduledDate.format(
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
              body: `Hi @${username}, you do not have permission to merge pull requests in this repository`,
            })
          );
        }
      }
    }
  });
};

const scheduleMergeRequest = async (context, scheduledDate) => {
  const {
    comment: {
      user: {
        login: { username },
      },
    },
  } = context.payload;

  const {
    issue: { state },
  } = context.payload;

  const {
    issue: { number },
  } = context.payload;

  if (scheduledDate.isSame(moment())) {
    // Check if the scheduled date is today
    // Check if the pull request is still open
    if (state === "open") {
      // Merge the pull request
      await context.github.pullRequests.merge(context.repo({ number }));

      await context.octokit.issues.createComment(
        context.issue({
          body: `Hi @${username}, your pull request was merged at ${moment().format()}`,
        })
      );
    }
  } else {
    const schedule = scheduledDate.format("s m H D M"); // format the scheduled date to match cron schedule format
    cron.schedule(schedule, async () => {
      if (state === "open") {
        await context.github.pullRequests.merge(
          context.repo({
            number,
          })
        );

        await context.octokit.issues.createComment(
          context.issue({
            body: `Hi @${username}, your pull request was merged at ${moment().format()}`,
          })
        );
      }
    });
  }
};
