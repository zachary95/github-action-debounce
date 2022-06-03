<center>
    <h1>GitHub Actions's Debounce ⏸</h1>
    <strong>Debounce multiple workflow runs.</strong> 
</center>

---
Useful if you have a workflow triggering on merge, and you prefer building only the latest and greatest version of your branch, rather than wasting time, money and energy to finish superseded workflow runs.   

This package will pause the execution of your workflow run and wait to be cancelled by a more recent workflow run, or resume execution.

## Getting Started

Within your workflow, preferably as one of the first steps, add the following snippet. 

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
- **`token`** (Optional) Personnal GitHub Access Token. Must have the `repo` scope. Default to `${{ github.token }}`
