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

function run() {
	var data = {};
	var projectID = SURI_PROJECT.replaceAll("/", "%2F");

  var gitlabApiUrl = WIDGET_CONFIG_GITLAB_URL + "/api/v4/projects/" + projectID;
	data.project = JSON.parse(
    Packages.get(gitlabApiUrl, "PRIVATE-TOKEN", WIDGET_CONFIG_GITLAB_TOKEN)).name;
  
    var apiUrl = gitlabApiUrl + "/merge_requests?state=" + SURI_MR_STATE;

    if (SURI_ASSIGNEE) {
      apiUrl = apiUrl + "&assignee_username=" + SURI_ASSIGNEE;
    }
    if (SURI_REVIEWER) {
      apiUrl = apiUrl + "&reviewer_username=" + SURI_REVIEWER;
    }
    if (SURI_LABEL) {
      apiUrl = apiUrl + "&labels=" + SURI_LABEL;
    }  

	var response = JSON.parse(
		Packages.get(apiUrl, "PRIVATE-TOKEN", WIDGET_CONFIG_GITLAB_TOKEN, "X-Total"));

	data.numberOfMRs = response;
	if (SURI_PREVIOUS && JSON.parse(SURI_PREVIOUS).numberOfMRs) {
		data.evolution = ((data.numberOfMRs - JSON.parse(SURI_PREVIOUS).numberOfMRs) * 100 / JSON.parse(SURI_PREVIOUS).numberOfMRs).toFixed(1);
		data.arrow = data.evolution == 0 ? '' : (data.evolution > 0 ? "up" : "down");
	}

	if (SURI_MR_STATE != 'all') {
		data.mrsState = SURI_MR_STATE;
	}

	return JSON.stringify(data);
}
