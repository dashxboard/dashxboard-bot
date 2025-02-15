# Contribution Guidelines

## Code of Conduct

To ensure an open and inclusive environment, please review and adhere to the [Code of Conduct](https://github.com/dashxboard/dashxboard-bot/blob/main/CODE_OF_CONDUCT.md).

## Reporting Issues and Requesting Features

To report a bug or request a new feature, submit an [Issue](https://github.com/dashxboard/dashxboard-bot/issues) using the appropriate template.

For feature implementations, consider the scope of the change before proceeding:

- **Major Features** require an open issue outlining the proposal for discussion. Significant modifications to documentation also fall under this category.

- **Small Features** can be directly submitted as a [Pull Request](https://github.com/dashxboard/dashxboard-bot/pulls).

## Submission Guidelines

### Submitting an Issue

Before opening a new issue, search the issue tracker to check if it has already been reported.

For bug reports, provide a minimal reproduction if applicable.

### Submitting a Pull Request (PR)

Follow these steps when submitting a Pull Request:

1. Check for any existing open or closed PRs related to the submission.

2. Ensure that an issue describes the problem being addressed or documents the design of the proposed feature. Discussing the design beforehand facilitates the review process.

3. Fork the repository and create a new git branch for the changes:

   ```shell
   git checkout -b my-fix-branch main
   ```

4. Commit the changes with a descriptive commit message following the guidelines outlined below:

   ```shell
   git commit --all
   ```

   **Note**: The optional `--all` flag automatically stages edited and removed files.

5. Push the branch to GitHub:

   ```shell
   git push origin my-fix-branch
   ```

6. Open a pull request to `dashxboard-bot:main` on GitHub.

**Note**: The Dashxboard maintainers reserve the right to decline pull requests from contributors who do not follow community guidelines.

After a pull request is merged, the branch can be safely deleted, and the latest changes can be pulled from the main repository:

- Delete the remote branch on GitHub via the web UI or using the command:

  ```shell
  git push origin --delete my-fix-branch
  ```

- Switch to the main branch:

  ```shell
  git checkout main -f
  ```

- Delete the local branch:

  ```shell
  git branch -D my-fix-branch
  ```

- Update the local `main` branch with the latest upstream version:

  ```shell
  git pull --ff upstream main
  ```

### Commit Message Format

The [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0) specification is followed to maintain a clear commit history.

Each commit message consists of a **header**, an optional **body**, and an optional **footer**.

```
<header>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

- The `header` is required and must follow the **Commit Message Header** format, that is `<type>[optional scope]: <description>` as outlined in the Conventional Commits documentation.
- If present, the `body` must be at least 20 characters long and follow the **Commit Message Body** format.
- The `footer` is optional and follows the **Commit Message Footer** format.

### Reverting Commits

If a commit reverts a previous change, the message should begin with `revert: `, followed by the header of the reverted commit.

The body of the commit message should clearly describe the reason for the reversion.
