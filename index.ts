import * as core from '@actions/core';

import WorkflowHandler from './lib/WorkflowHandler';
import Clock from './lib/Clock';
import InputParser from './lib/InputParser';

async function run() {
  try {
    const inputParser = new InputParser();

    const secondsToWait = inputParser.getWait();
    const tokenInput = inputParser.getToken();

    const workflow = new WorkflowHandler({ token: tokenInput });
    const clock = new Clock();

    core.info(`⏸  Debouncing ${secondsToWait} seconds before execution.`);

    if (!process.env.ACT) {
      const workflowsToCancel = await workflow.listActiveWorkflowsToCancel();

      const runIdsToCancel = workflowsToCancel.map(workflow => workflow.id);

      const cancelledWorkflows = await workflow.cancelWorkflows(runIdsToCancel);

      core.info(`🧹  Cancelled ${cancelledWorkflows.length} superseded workflow runs. Starting the clock ...`);
    }

    // at least report status every minute for long intervals, and max every second for short intervals
    const intervalSec = Math.max(Math.min((secondsToWait) / 10, 60), 1)

    await clock.setTimeoutWithLogging(secondsToWait * 1000, intervalSec * 1000, (timeElapsed, timeRemaining) => {
      if (await workflow.isCurrentWorkflowSuperseded()) {
        // stop waiting if workflow has been superseded
        return false
      }

      const relativeTimeRemaining = Clock.dayjs().add(timeRemaining, 'milliseconds').fromNow();

      core.info(`⏲  Executing ${relativeTimeRemaining}, unless another workflow runs ...`);

      return true
    });

    if (!process.env.ACT) {
      // Technically, a more recent workflow would have cancelled this workflow,
      // meaning this code wouldn't run, but we're never sure what could happen.
      // So here's a failsafe.
      const hasBeenSuperseded = await workflow.isCurrentWorkflowSuperseded();

      if (hasBeenSuperseded) {
        core.notice('⏹  Another workflow run has superseded this workflow run. Cancelling ...')

        await workflow.cancelCurrentWorkflowRun();

        // Stalling this job to give the new GitHub Action some time to cancel this workflow run.
        await clock.setTimeout(secondsToWait);

        // If for some reasons that wasn't enough, failing the job.
        return core.setFailed('⏹  Another workflow run has superseded this workflow run.');
      }
    }

    core.info(`▶️  ${secondsToWait} seconds has elapsed and no new runs of this workflow could be found. Resuming execution ...`)
  } catch (error) {
    console.log(error);

    core.setFailed(error.message);
  }
}

run();
