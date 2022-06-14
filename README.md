<h1 align="center">GitHub Actions's Debounce ⏸</h1>

Useful if you have a workflow triggering on merge and prefer building only the latest and greatest version of your branch.

This package will pause the execution of your workflow run and wait to be canceled by a more recent workflow run or resume execution.

## Usage

Add the following snippet within your workflow, preferably as one of the first steps. 

```yaml
  ...
  - name: Debounce 1 minute
    uses: zachary95/github-actions-debounce
    with:
      wait: 60
  ...
```

## Options 

- **`wait`** Time to delay a GitHub Action. Always plan larger than you really need to defeat all GitHub API lags.
- **`token`** Personal GitHub Access Token. Must have the `repo` scope. Default to `${{ github.token }}` (Optional)
