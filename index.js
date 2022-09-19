const core = require("@actions/core");
const github = require("@actions/github");

const run = async () => {
  try {
    // `pr-number` input defined in action metadata file
    const prNumber = core.getInput("pr-number");
    console.log(`PR: ${prNumber}!`);

    const githubToken = core.getInput("GITHUB_TOKEN");
    const octokit = github.getOctokit(githubToken);

    const { data: commits } = await octokit.rest.pulls.listCommits({
      owner: "yining1023",
      repo: "test-github-actions",
      pull_number: prNumber,
    });

    console.log(commits);

    const changesByGroup = {};

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const message = commit.commit.message;
      const commitPrNumberReg = new RegExp("#[0-9]+\\)").exec(message);
      if (commitPrNumberReg && commitPrNumberReg[0]) {
        const commitPrNumber = commitPrNumberReg[0]
          .replace("#", "")
          .replace(")", "");
        const { data: commitPR } = await octokit.rest.pulls.get({
          owner: "yining1023",
          repo: "test-github-actions",
          pull_number: commitPrNumber,
        });
        if (commitPR) {
          console.log(commitPR);
          const commitPRBody = commitPR.body;
          const categoryReg = new RegExp("- \\[x\\] ").exec(commitPRBody);
          if (categoryReg && categoryReg[0]) {
            const endIndex = commitPRBody.indexOf("\n", categoryReg.index);
            const category = commitPRBody.substring(
              categoryReg.index + 6,
              endIndex
            );
            if (!changesByGroup[category]) {
              changesByGroup[category] = "";
            }
            changesByGroup[category] += `- ${message}\n`;
          }
        }
      }
    }

    const changes = ``;
    console.log(changesByGroup);
    for (const category in changesByGroup) {
      changes += `**${category}:**\n`;
      changes += changesByGroup[category];
    }

    core.setOutput("changes", changes);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
