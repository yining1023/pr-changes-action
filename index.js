const core = require("@actions/core");
const github = require("@actions/github");

const run = async () => {
  try {
    const prNumber = core.getInput("pr-number");

    const githubToken = core.getInput("GITHUB_TOKEN");
    const octokit = github.getOctokit(githubToken);
    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;

    const commits = await octokit.paginate(octokit.rest.pulls.listCommits, {
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
        if (!commitPR || !commitPR.body) continue;

        const commitPRBody = commitPR.body;

        // Remove text before this heading, because any checkbox can match the regex for [x]
        const typeOfChangeHeadingIndex = commitPRBody.indexOf("Type of change");
        if (typeOfChangeHeadingIndex === -1) continue;
        const bodyAfterHeading = commitPRBody.substring(
          typeOfChangeHeadingIndex
        );

        // Matches [x][X][ x][x ] followed by anything and then the end of the line
        const categoryReg = new RegExp("(- \\[ *[xX] *\\] )(.*$)", "m").exec(
          bodyAfterHeading
        );
        let category = "Other";
        if (categoryReg && categoryReg[2]) {
          // The contents of the second capture group `(.*$)`
          category = categoryReg[2];
        }

        if (!changesByGroup[category]) {
          changesByGroup[category] = [];
        }
        const text = message.substring(0, commitPrNumberReg.index - 1);
        const link = commitPR.html_url;
        changesByGroup[category].push(`- [${text}](${link})\r\n`);
      }
    }

    let changes = ``;
    for (let group in changesByGroup) {
      changes += `\n`;
      changes += `**${group}:**\r\n`;
      changes += changesByGroup[group].map((change) => change).join("");
    }

    const { data: releasePr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });
    const newBody = `Shoutout to @design-team @engineering-team for all the updates!:tada:\r\n${changes}\r\nPR: [#${prNumber}](https://github.com/runwayml/app/pull/${prNumber})\r\n`;

    await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number: prNumber,
      body: newBody,
    });
    core.setOutput("changes", newBody);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
