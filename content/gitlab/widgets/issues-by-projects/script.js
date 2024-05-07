/*
  * Copyright 2012-2021 the original author or authors.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *      http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */
var data = {};

function run() {
	var page = 1;
	var perPage = 100;
	var issues = [];
	var projectsByNumberOfIssues = [];
	var oldestIssueCreatedDate = new Date();
	data.apps = {};
	data.apps.values = [];

	data.fromDate = computeStartDate();
	var projectOrGroupType = computeIDType();

	var projectOrGroupIDs = SURI_ID.replaceAll("/", "%2F").split(",");

	projectOrGroupIDs.forEach(function(id) {
		issues = []

		var project = JSON.parse(
			Packages.get(WIDGET_CONFIG_GITLAB_URL + "/api/v4/" + projectOrGroupType + "/" + id, "PRIVATE-TOKEN", WIDGET_CONFIG_GITLAB_TOKEN));

		var response;

		do {
			response = JSON.parse(
				Packages.get(WIDGET_CONFIG_GITLAB_URL + "/api/v4/" + projectOrGroupType + "/" + id + "/issues?per_page=" + perPage + "&page=" + page, "PRIVATE-TOKEN", WIDGET_CONFIG_GITLAB_TOKEN));

			issues = issues.concat(response);
			page++;
		} while (response && response.length > 0 && response.length === perPage);
		page = 1;

		// Keep issues created after the given date
		if (data.fromDate) {
			issues = issues.filter(function(issue) {
				if (issue.created_at && new Date(issue.created_at) >= new Date(data.fromDate)) {
					return issue;
				}
			});
		}

		if (issues.length > 0) {
			issues.sort(orderIssuesByDate);

			if (new Date(oldestIssueCreatedDate) > new Date(issues[0].created_at)) {
				oldestIssueCreatedDate = formatDate(issues[0].created_at);
			}
		}

		projectsByNumberOfIssues.push({
			"name": project.name,
			"nbIssues": issues.length
		});
	});

	if (SURI_ORDER_BY) {
		if (SURI_ORDER_BY === "PROJECT_NAME") {
			projectsByNumberOfIssues.sort(orderByProjectName);
		} else {
			projectsByNumberOfIssues.sort(orderByNumberOfIssues);
		}
	}

	if (!data.fromDate) {
		data.fromDate = oldestIssueCreatedDate;
	}

	projectsByNumberOfIssues.forEach(function(application, index) {
		data.apps.values[index] = JSON.stringify(projectsByNumberOfIssues[index]);
	});

	return JSON.stringify(data);
}

/**
* Compute the ID type passed from the widget parameters
* @return {string}
*/
function computeIDType(){
    if (SURI_ID_TYPE === "Group ID") {
        return "groups";
    }else{
        return "projects";
    }
}

/**
 * Compute the start date of the issues from the widget parameters
 * @returns {string}
 */
function computeStartDate() {
	if (SURI_DATE) {
		return SURI_DATE.slice(4) + "-" + SURI_DATE.slice(2, 4) + "-" + SURI_DATE.slice(0, 2);
	}

	if (SURI_PERIOD) {
		var numberOfPeriods = 1;
		if (SURI_NUMBER_OF_PERIOD) {
			numberOfPeriods = SURI_NUMBER_OF_PERIOD;
		}

		var computedDate = new Date();

		if (SURI_PERIOD === "Day") {
			computedDate.setDate(new Date().getDate() - numberOfPeriods);
		} else if (SURI_PERIOD === "Week") {
			computedDate.setDate(new Date().getDate() - 7 * numberOfPeriods);
		} else if (SURI_PERIOD === "Month") {
			computedDate.setMonth(new Date().getMonth() - numberOfPeriods);
		} else if (SURI_PERIOD === "Year") {
			computedDate.setFullYear(new Date().getFullYear() - numberOfPeriods);
		}

		computedDate.setUTCHours(0, 0, 0, 0);

		return formatDate(computedDate);
	}
}

/**
 * Format the date to keep yyyy-MM-dd
 */
function formatDate(date) {
	return new Date(date).getFullYear()
		+ "-"
		+ ("0" + (new Date(date).getMonth() + 1)).slice(-2)
		+ "-"
		+ ("0" + new Date(date).getUTCDate()).slice(-2);
}

/**
 * Order by project name
 *
 * @param a The first project
 * @param b The second project
 * @returns {number}
 */
function orderByProjectName(a, b) {
	if (a.name < b.name) {
		return -1;
	}

	if (a.name > b.name) {
		return 1;
	}

	return 0;
}

/**
 * Order by number of issues
 *
 * @param a The first project
 * @param b The second project
 * @returns {number}
 */
function orderByNumberOfIssues(a, b) {
	if (a.nbIssues > b.nbIssues) {
		return -1;
	}

	if (a.nbIssues < b.nbIssues) {
		return 1;
	}

	return 0;
}

/**
 * Order the issues by date
 *
 * @param firstIssue The first issue
 * @param secondIssue The second issue
 * @returns {number}
 */
function orderIssuesByDate(firstIssue, secondIssue) {
	if (new Date(firstIssue.created_at) < new Date(secondIssue.created_at)){
		return -1;
	}

	if (new Date(firstIssue.created_at) > new Date(firstIssue.created_at)){
		return 1;
	}

	return 0;
}
