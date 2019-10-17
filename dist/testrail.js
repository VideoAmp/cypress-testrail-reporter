"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalRunId = null;
var axios = require('axios');
var chalk = require('chalk');
var caseIdVault = [];
var testCaseIdVault = [];
var TestRail = /** @class */ (function () {
    function TestRail(options) {
        this.options = options;
        this.base = "https://" + options.domain + "/index.php?/api/v2";
    }
    TestRail.prototype.createRun = function (name, description) {
        if (exports.globalRunId == null) {
            axios({
                method: 'POST',
                url: this.base + "/add_run/" + this.options.projectId,
                headers: { 'Content-Type': 'application/json' },
                auth: {
                    username: this.options.username,
                    password: this.options.password,
                },
                data: JSON.stringify({
                    suite_id: this.options.suiteId,
                    name: name,
                    description: description,
                    include_all: true,
                }),
                retry: { retries: 3 }
            })
                .then(function (response) {
                exports.globalRunId = response.data.id;
            })
                .catch(function (error) { return console.error(error); });
        }
        else {
            this.updateRun(true);
        }
    };
    TestRail.prototype.updateRun = function (includeAll) {
        testCaseIdVault.push.apply(testCaseIdVault, caseIdVault);
        axios({
            method: 'POST',
            url: this.base + "/update_run/" + exports.globalRunId,
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
            .catch(function (error) { return console.error(error); });
    };
    TestRail.prototype.deleteRun = function () {
        axios({
            method: 'POST',
            url: this.base + "/delete_run/" + exports.globalRunId,
            headers: { 'Content-Type': 'application/json' },
            auth: {
                username: this.options.username,
                password: this.options.password,
            },
        })
            .catch(function (error) { return console.error(error); });
    };
    TestRail.prototype.publishResults = function (results) {
        var _this = this;
        var caseIdContainer = results.map(function (case_ids) {
            return case_ids.case_id;
        });
        caseIdVault.push.apply(caseIdVault, caseIdContainer);
        axios({
            method: 'POST',
            url: this.base + "/add_results_for_cases/" + exports.globalRunId,
            headers: { 'Content-Type': 'application/json' },
            auth: {
                username: this.options.username,
                password: this.options.password,
            },
            data: JSON.stringify({ results: results }),
            retry: { retries: 3 }
        })
            .then(function (response) {
            console.log('\n', chalk.magenta.underline.bold('(TestRail Reporter)'));
            console.log('\n', " - Results are published to " + chalk.magenta("https://" + _this.options.domain + "/index.php?/runs/view/" + exports.globalRunId), '\n');
        })
            .catch(function (error) { return console.error(error); });
    };
    return TestRail;
}());
exports.TestRail = TestRail;
//# sourceMappingURL=testrail.js.map