import Clock from './Clock';

import { GitHub } from '@actions/github/lib/utils';
import * as github from '@actions/github';

import { components } from '@octokit/openapi-types';
import { Endpoints } from '@octokit/types';

class WorkflowHandler {
  /**
   * Hydrated GitHub client.
   */
  private octoKit: InstanceType<typeof GitHub>

  /**
   * GITHUB_TOKEN or Personnal Access Token.
   */
  protected token: string

  /**
   * List of status to cancel when superseded.
   */
  private cancellableWorkflowStatus = [
    'action_required', 'neutral', 'stale',
    'in_progress', 'queued', 'requested',
    'waiting',
  ];

  constructor({ token }) {
    this.octoKit = github.getOctokit(token);
  }

  async listActiveWorkflowsToCancel() {
    const workflows = await this.fetchWorkflows();
    const currentWorkflow = await this.findCurrentWorkflow(workflows.data.workflow_runs);

    return workflows.data.workflow_runs.filter(workflow => {
      return this.cancellableWorkflowStatus.includes(workflow.status)
        && workflow.name === github.context.workflow
        && Clock.dayjs(workflow.created_at).isBefore(currentWorkflow.created_at)
    });
  }

  async cancelCurrentWorkflowRun() {
    return this.cancelWorkflows([github.context.runId]);
  }

  async cancelWorkflows(ids: Array<components["schemas"]["workflow-run"]["id"]>) {
    const errorAlreadyCancelled = {
      status: 409,
      message: 'Cannot cancel a workflow run that is completed.'
    }

    const cancellingWorkflows = ids.map(async id => {
      try {
        return await this.octoKit.rest.actions.cancelWorkflowRun({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          run_id: id,
        });
      } catch (ex) {
        // It happens that lags between a cancellation request
        // and its actual cancellation raises this exception.
        if (
          ex.response.status === errorAlreadyCancelled.status
          && ex.response.data.message === errorAlreadyCancelled.message
        ) {
          console.warn(`Tried to cancel workflow ID ${id} which was already cancelled. Ignoring error ...`);
        } else {
          throw ex;
        }
      }
    })

    return await Promise.all(cancellingWorkflows);
  }

  async isCurrentWorkflowSuperseded() {
    const workflows = await this.fetchWorkflows();
    const currentWorkflow = this.findCurrentWorkflow(workflows.data.workflow_runs);

    const otherWorkflowRuns = workflows.data.workflow_runs.filter(workflow =>
      workflow.name === github.context.workflow
      && Clock.dayjs(workflow.created_at).isAfter(currentWorkflow.created_at)
    );

    return otherWorkflowRuns.length !== 0;
  }

  private async fetchWorkflows() {
    return await this.octoKit.rest.actions.listWorkflowRunsForRepo({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    });
  }

  private findCurrentWorkflow(workflows: Endpoints["GET /repos/{owner}/{repo}/actions/runs"]["response"]["data"]["workflow_runs"]) {
    return workflows.find(workflow =>
      workflow.id === github.context.runId
    );
  }
}

export default WorkflowHandler
