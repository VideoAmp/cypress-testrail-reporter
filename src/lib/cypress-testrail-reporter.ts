import { reporters } from 'mocha';
import * as moment from 'moment';
import { TestRail } from './testrail';
import { titleToCaseIds } from './shared';
import { Status, TestRailResult } from './testrail.interface';
const chalk = require('chalk');

export class CypressTestRailReporter extends reporters.Spec {
  private results: TestRailResult[] = [];
  private testRail: TestRail;

  constructor(runner: any, options: any) {
    super(runner);

    let reporterOptions = options.reporterOptions;
    this.testRail = new TestRail(reporterOptions);
    this.validate(reporterOptions, 'domain');
    this.validate(reporterOptions, 'username');
    this.validate(reporterOptions, 'password');
    this.validate(reporterOptions, 'projectId');
    this.validate(reporterOptions, 'suiteId');
    const executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');
    const name = `${reporterOptions.runName || 'Automated test run'} ${executionDateTime}`;
    const buildUrl = `${reporterOptions.buildUrl}`;
    const githubUrl = `${reporterOptions.githubUrl}`;
    var description = `For the Cypress run visit https://dashboard.cypress.io/#/projects/runs \n CICD Job URL: ${buildUrl}`;
    if (githubUrl) {
      description = description.concat(`\n GitHub Commit URL: ${githubUrl}`);
    }
    runner.on('start', async () => {
      this.testRail.createRun(name, description);
    });

    runner.on('pass', test => {
      const caseIds = titleToCaseIds(test.title);
      if (caseIds.length > 0) {
        const results = caseIds.map(caseId => {
          return {
            case_id: caseId,
            status_id: Status.Passed,
            comment: `Execution time: ${test.duration}ms`,
          };
        });
        this.results.push(...results);
      }
    });

    runner.on('fail', test => {
      const caseIds = titleToCaseIds(test.title);
      if (caseIds.length > 0) {
        const results = caseIds.map(caseId => {
          return {
            case_id: caseId,
            status_id: Status.Failed,
            comment: `${test.err.message}`,
          };
        });
        this.results.push(...results);
      }
    });

    runner.on('end', () => {
      if (this.results.length == 0) {
        console.log('\n', chalk.magenta.underline.bold('(TestRail Reporter)'));
        console.warn(
          '\n',
          'No testcases were matched. Ensure that your tests are declared correctly and matches Cxxx',
          '\n'
        );
        this.testRail.updateRun(false);
        return;
      }
      this.testRail.publishResults(this.results);
      this.testRail.updateRun(false)
    });
  }

  private validate(options, name: string) {
    if (options == null) {
      throw new Error('Missing reporterOptions in cypress.json');
    }
    if (options[name] == null) {
      throw new Error(`Missing ${name} value. Please update reporterOptions in cypress.json`);
    }
  }
}
