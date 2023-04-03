/**
 * This is the main entrypoint to my Probot app
 * @param {import('probot').Probot} app
 */

const moment = require("moment");
const APP_NAME = "agba-merger";
const MERGE_KEYWORD = "merge";

module.exports = (app) => {
  const mergePullRequests = async (context) => {
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;

    const issues = await context.octokit.issues.listForRepo({
      owner,
      repo,
      labels: "scheduled for merge",
    });

    const now = moment();

    for (const issue of issues.data) {
      const scheduledDateString = issue.labels
        .find((label) => label.name.startsWith("schedule: "))
        ?.name.slice(10);

      if (!scheduledDateString) continue;

      const scheduledDate = moment(scheduledDateString);

      if (now.isAfter(scheduledDate)) {
        try {
          const pullRequest = await context.octokit.pulls.get({
            owner,
            repo,
            pull_number: issue.number,
          });

          if (pullRequest.data.state === "open") {
            const mergeResult = await context.octokit.pulls.merge({
              owner,
              repo,
              pull_number: issue.number,
            });

            await context.octokit.issues.createComment(
              context.issue({
                body: `Merged pull request #${issue.number}`,
              })
            );
          } else {
            await context.octokit.issues.createComment(
              context.issue({
                body: `Pull request #${issue.number} is already closed or merged.`,
              })
            );
          }
        } catch (error) {
          await context.octokit.issues.createComment(
            context.issue({
              body: `Error merging pull request #${issue.number}: ${error}`,
            })
          );
        }
      }
    }

    setTimeout(() => mergePullRequests(context), 60 * 1000);
  };

  app.on("issue_comment.created", async (context) => {
    // await mergePullRequests(context);
    // so that USERNAME is always defined within the scopt of the webhook event, even if an error occurs before it is assigned a value.
    const USERNAME = context.payload.comment.user.login;
    const COMMENT = context.payload.comment.body;
    const AUTHOR_ROLE = context.payload.issue.author_association;
    const ISSUE_NUMBER = context.payload.issue.number;
    const OWNER = context.payload.repository.owner.login;
    const REPO = context.payload.repository.name;

    const issue = await context.octokit.issues.get({
      owner: OWNER,
      repo: REPO,
      issue_number: ISSUE_NUMBER,
    });

    const labels = context.payload.issue.labels.map((label) => label.name);
    const scheduledDateMatch = COMMENT.match(/(\d{4}-\d{2}-\d{2})/);
    const scheduledTimeMatch = COMMENT.match(/(\d{2}:\d{2})/);

    try {
      if (
        COMMENT.includes(`@${APP_NAME}`) &&
        COMMENT.includes(MERGE_KEYWORD) &&
        scheduledDateMatch &&
        scheduledTimeMatch
      ) {
        if (AUTHOR_ROLE === "OWNER" || AUTHOR_ROLE === "COLLABORATOR") {
          // get the scheduled date that is in this format "yyyy-mm-dd" from the comment body
          // format it by removing the `-` char.
          const dateArray = scheduledDateMatch[1].split("-");
          // get the time from the comment body
          const timeArray = scheduledTimeMatch[1].split(":");

          // initialize new date object
          const scheduledDate = new Date(
            dateArray[0],
            dateArray[1] - 1,
            dateArray[2],
            timeArray[0],
            timeArray[1],
            0
          );

          await context.octokit.issues.addLabels(
            context.issue({
              labels: [
                "scheduled for merge",
                `schedule: ${scheduledDateMatch[0]}`,
              ],
            })
          );

          await context.octokit.issues.createComment(
            context.issue({
              body: `Hi @${USERNAME}, your merge request has been scheduled for ${scheduledDate.toString()}`,
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
        !COMMENT.includes(MERGE_KEYWORD) &&
        !scheduledDateMatch &&
        !scheduledTimeMatch &&
        (!labels.includes("scheduled for merge") ||
          !labels.includes(/schedule: \d{4}-\d{2}-\d{2}/))
      ) {
        await context.octokit.issues.createComment(
          context.issue({
            body: `Hi @${USERNAME}, you need to pass the "merge" keyword and the date and time you'd want this pull request to be merged in this format: "YYYY-MM-DD hh:mm"`,
          })
        );
      }
    } catch (error) {
      console.error(error);

      await context.octokit.issues.createComment(
        context.issue({
          body: `Hi @${USERNAME}, something went wrong while I tried scheduling your merge request. Please try again later or contact an admin for assistance.`,
        })
      );
    }
  });
};
