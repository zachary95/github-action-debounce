import * as core from '@actions/core';

import WorkflowHandler from './lib/WorkflowHandler';
import Clock from './lib/Clock';

async function run() {
  try {
    const secondsToWait = Number(core.getInput('wait'));
    const token = core.getInput('token');

    const workflow = new WorkflowHandler({ token });
    const clock = new Clock();

    core.info(`⏸  Debouncing ${secondsToWait} seconds before execution.`);

    const workflowsToCancel = await workflow.listActiveWorkflowsToCancel();

    const runIdsToCancel = workflowsToCancel.map(workflow => workflow.id);

    const cancelledWorkflows = await workflow.cancelWorkflows(runIdsToCancel);

    core.info(`🧹  Cancelled ${cancelledWorkflows.length} superseded workflow runs. Starting the clock ...`);

    await clock.setTimeoutWithLogging(secondsToWait, secondsToWait / 10, (timeElapsed, timeRemaining) => {
      const relativeTimeRemaining = Clock.dayjs().add(timeRemaining, 'seconds').fromNow();

      core.info(`⏲  Executing ${relativeTimeRemaining}, unless another workflow runs ...`);
    });

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
      core.setFailed('⏹  Another workflow run has superseded this workflow run.');
    } else {
      core.info(`▶️  ${secondsToWait} seconds has elapsed and no new runs of this workflow could be found. Resuming execution ...`)
    }
  } catch (error) {
    console.log(error);

    core.setFailed(error.message);
  }
}

run();
