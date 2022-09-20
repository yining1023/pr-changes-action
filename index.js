const core = require("@actions/core");
const github = require("@actions/github");

const run = async () => {
  try {
    const prNumber = core.getInput("pr-number");

    const githubToken = core.getInput("GITHUB_TOKEN");
    const octokit = github.getOctokit(githubToken);
    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;

    console.log({ prNumber, owner, repo });

    const { data: commits } = await octokit.rest.pulls.listCommits({
      owner,
      repo,
      pull_number: prNumber,
    });

    let changesByGroup = {};

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const message = commit.commit.message;
      const commitPrNumberReg = new RegExp("#[0-9]+\\)").exec(message);
      if (commitPrNumberReg && commitPrNumberReg[0]) {
        const commitPrNumber = commitPrNumberReg[0]
          .replace("#", "")
          .replace(")", "");
        const { data: commitPR } = await octokit.rest.pulls.get({
          owner,
          repo,
          pull_number: commitPrNumber,
        });
        if (commitPR) {
          const commitPRBody = commitPR.body;
          const categoryReg = new RegExp("- \\[x\\] ").exec(commitPRBody);
          if (categoryReg && categoryReg[0]) {
            const endIndex = commitPRBody.indexOf("\n", categoryReg.index);
            const category = commitPRBody.substring(
              categoryReg.index + 6,
              endIndex - 1
            );
            if (!changesByGroup[category]) {
              changesByGroup[category] = [];
            }
            const text = message.substring(0, commitPrNumberReg.index);
            const link = commitPR.html_url;
            changesByGroup[category].push(`- [${text}](${link})\r\n`);
          }
        }
      }
    }

    let changes = ``;
    console.log("changesByGroup", changesByGroup);
    for (let group in changesByGroup) {
      changes += `\n`;
      changes += `**${group}:**\r\n`;
      changes += changesByGroup[group].map((change) => change).join("");
    }
    console.log("changes", changes);
    core.setOutput("changes", changes);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
