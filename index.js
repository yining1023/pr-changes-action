const core = require("@actions/core");
const github = require("@actions/github");

try {
  // `pr-number` input defined in action metadata file
  const prNumber = core.getInput("pr-number");
  console.log(`PR: ${prNumber}!`);

  const githubToken = core.getInput("GITHUB_TOKEN");
  const octokit = github.getOctokit(githubToken);

  const commits = await octokit.rest.pulls.listCommits({
    owner: "yining1023",
    repo: "test-github-actions",
    pull_number: prNumber,
  });

  console.log(commits);

  let changes = `
**New Features:**
**UX Improvement:**
**Fixes:**
**Performance Improvement:**
**Documentation:**
**Dev experience:**
  `;

  core.setOutput("changes", commits);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
