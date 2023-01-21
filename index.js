/**
 * This is the main entrypoint to my Probot app
 * @param {import('probot').Probot} app
 */

const schedule = require("node-schedule");
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

      const scheduledDateMatch = COMMENT.match(/(\d{4}-\d{2}-\d{2})/);
      const scheduledTimeMatch = COMMENT.match(/(\d{2}:\d{2})/);

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

          console.log(scheduledDate);

          await context.octokit.issues.createComment(
            context.issue({
              body: `Hi @${USERNAME}, your merge request has been scheduled for ${scheduledDate.toString()}`,
            })
          );

          scheduleMergeRequest(context, scheduledDate, ISSUE_NUMBER, USERNAME);
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
        !scheduledTimeMatch
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
          body: `@${USERNAME}, something went wrong while I tried scheduling your merge request. Please try again later or contact an admin for assistance.`,
        })
      );
    }
  });
};

const scheduleMergeRequest = (
  context,
  scheduledDate,
  ISSUE_NUMBER,
  USERNAME
) => {
  schedule.scheduleJob(scheduledDate, async () => {
    const OWNER = context.payload.repository.owner.login;

    try {
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
    } catch (error) {
      console.error(error);
      await context.octokit.issues.createComment(
        context.issue({
          body: `@${USERNAME}, something went wrong while I tried scheduling your merge request. Please try again later or contact ${OWNER} for assistance.`,
        })
      );
    }
  });
};
