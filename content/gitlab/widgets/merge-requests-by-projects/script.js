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
	var mergeRequests = [];
	var projectsByNumberOfMergeRequests = [];
	var oldestMRCreatedDate = new Date();
	data.apps = {};
	data.apps.values = [];

	data.fromDate = computeStartDate();
	var projectOrGroupType = computeIDType();

	var projectOrGroupIDs = SURI_ID.replaceAll("/", "%2F").split(",");

	projectOrGroupIDs.forEach(function(id) {
		mergeRequests = []

		var project = JSON.parse(
			Packages.get(WIDGET_CONFIG_GITLAB_URL + "/api/v4/" + projectOrGroupType + "/" + id, "PRIVATE-TOKEN", WIDGET_CONFIG_GITLAB_TOKEN));

		var response;

		do {
			response = JSON.parse(
				Packages.get(WIDGET_CONFIG_GITLAB_URL + "/api/v4/" + projectOrGroupType + "/" + id + "/merge_requests?per_page=" + perPage + "&page=" + page, "PRIVATE-TOKEN", WIDGET_CONFIG_GITLAB_TOKEN));

			mergeRequests = mergeRequests.concat(response);
			page++;
		} while (response && response.length > 0 && response.length === perPage);
		page = 1;

		// Keep mergeRequests created after the given date
		if (data.fromDate) {
			mergeRequests = mergeRequests.filter(function(mergeRequest) {
				if (mergeRequest.created_at && new Date(mergeRequest.created_at) >= new Date(data.fromDate)) {
					return mergeRequest;
				}
			});
		}

		if (mergeRequests.length > 0) {
			mergeRequests.sort(orderMergeRequestsByDate);

			if (new Date(oldestMRCreatedDate) > new Date(mergeRequests[0].created_at)) {
				oldestMRCreatedDate = formatDate(mergeRequests[0].created_at);
			}
		}

		projectsByNumberOfMergeRequests.push({
			"name": project.name,
			"nbMergeRequests": mergeRequests.length
		});
	});

	if (SURI_ORDER_BY) {
		if (SURI_ORDER_BY === "PROJECT_NAME") {
			projectsByNumberOfMergeRequests.sort(orderByProjectName);
		} else {
			projectsByNumberOfMergeRequests.sort(orderByNumberOfMergeRequests);
		}
	}

	if (!data.fromDate) {
		data.fromDate = oldestMRCreatedDate;
	}

	projectsByNumberOfMergeRequests.forEach(function(application, index) {
		data.apps.values[index] = JSON.stringify(projectsByNumberOfMergeRequests[index]);
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
 * Compute the start date of the mergeRequests from the widget parameters
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
 * Order by number of mergeRequests
 *
 * @param a The first project
 * @param b The second project
 * @returns {number}
 */
function orderByNumberOfMergeRequests(a, b) {
	if (a.nbMergeRequests > b.nbMergeRequests) {
		return -1;
	}

	if (a.nbMergeRequests < b.nbMergeRequests) {
		return 1;
	}

	return 0;
}

/**
 * Order the mergeRequests by date
 *
 * @param firstMR The first mergeRequest
 * @param secondMR The second mergeRequest
 * @returns {number}
 */
function orderMergeRequestsByDate(firstMR, secondMR) {
	if (new Date(firstMR.created_at) < new Date(secondMR.created_at)){
		return -1;
	}

	if (new Date(firstMR.created_at) > new Date(firstMR.created_at)){
		return 1;
	}

	return 0;
}
