const { Probot } = require("probot");
const config = require("probot-config");

const app = new Probot({
  id: process.env.APP_ID,
  secret: process.env.WEBHOOK_SECRET,
  token: process.env.AM_TOKEN,
});

app.load(async (app) => {
  app.on("issue_comment.created", async (context) => {
    // check if the comment contains the merge keyword
    if (context.payload.comment.body.toLowerCase().includes("merge")) {
      // merge the pull request
      const { data } = await context.github.pulls.merge(
        context.issue({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          pull_number: context.payload.pull_request.number,
        })
      );
      if (data.merged) {
        // if merge is successful, add a comment on the pull request
        context.github.issues.createComment(
          context.issue({
            body: "Pull request successfully merged!",
          })
        );
      }
    }
  });
});
