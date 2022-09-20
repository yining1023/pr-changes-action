# Get PR changes action

This action summarizes the changes in a PR based on all commits. And update the PR body with the changes.

## Inputs

## `pr-number`

**Required** The PR number

## Outputs

## `changes`

The changes that are included in this PR.

## Example usage

```
- name: Update PR Body
  id: update-pull-request-body
  uses: yining1023/pr-changes-action@v1.4
  with:
    pr-number: ${{steps.create-pull-request.outputs.PULL_REQUEST_NUMBER}}
    GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}'
```
