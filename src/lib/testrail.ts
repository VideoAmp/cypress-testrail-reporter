export let globalRunId = null;
const axios = require('axios');
const chalk = require('chalk');
import { TestRailOptions, TestRailResult } from './testrail.interface';
let caseIdVault: number[] = [];
let testCaseIdVault: number[] = [];

export class TestRail {
  private base: String;

  constructor(private options: TestRailOptions) {
    this.base = `https://${options.domain}/index.php?/api/v2`;
  }

  public createRun(name: string, description: string) {
    if (globalRunId == null){
      axios({
          method: 'POST',
          url: `${this.base}/add_run/${this.options.projectId}`,
          headers: { 'Content-Type': 'application/json' },
          auth: {
              username: this.options.username,
              password: this.options.password,
          },
          data: JSON.stringify({
              suite_id: this.options.suiteId,
              name,
              description,
              include_all: true,
          }),
          retry: { retries: 3 }
      })
        .then(response => {
          globalRunId = response.data.id;
        })
        .catch(error => console.error(error));
       } else {
        this.updateRun(true)
       }
    }

    public updateRun(includeAll: boolean) {
        testCaseIdVault.push(...caseIdVault);
      axios({
          method: 'POST',
          url: `${this.base}/update_run/${globalRunId}`,
          headers: { 'Content-Type': 'application/json' },
          auth: {
              username: this.options.username,
              password: this.options.password,
          },
          data: JSON.stringify({
              include_all: includeAll,
              case_ids: testCaseIdVault,
          }),
          retry: { retries: 3 }
      })
        .catch(error => console.error(error));
    }

  public deleteRun() {
    axios({
        method: 'POST',
        url: `${this.base}/delete_run/${globalRunId}`,
        headers: { 'Content-Type': 'application/json' },
        auth: {
            username: this.options.username,
            password: this.options.password,
        },
    })
        .catch(error => console.error(error));
  }

  public publishResults(results: TestRailResult[]) {
    let caseIdContainer = results.map(function (case_ids) {
      return case_ids.case_id;
    });
    caseIdVault.push(...caseIdContainer);
    axios({
        method: 'POST',
        url: `${this.base}/add_results_for_cases/${globalRunId}`,
        headers: { 'Content-Type': 'application/json' },
        auth: {
            username: this.options.username,
            password: this.options.password,
        },
        data: JSON.stringify({ results }),
        retry: { retries: 3 }
    })
      .then(response => {
        console.log('\n', chalk.magenta.underline.bold('(TestRail Reporter)'));
        console.log(
          '\n',
          ` - Results are published to ${chalk.magenta(
            `https://${this.options.domain}/index.php?/runs/view/${globalRunId}`
          )}`,
          '\n'
        );
      })
      .catch(error => console.error(error));
  }
}
