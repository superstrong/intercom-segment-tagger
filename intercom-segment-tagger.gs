function runEverything() {

    // Make it your own
    var target = "companies"; // change to "users" if desired
    var desiredTag = ""; // e.g., "New Tag 1". tag name must match existing tag exactly or a new tag will be created
    var segmentId = ""; // e.g., "5c1d18fddf74c998cb0a9dcd" get this from the URL while viewing a segment
    var ownerEmail = ""; // email address to notify of errors and optional script results
    var sendResultEmails = true; // true or false -- do you want to be notified every time the script runs?

    // ************************************
    // No need to touch anything below this
    // ************************************
  
    // Get the Intercom auth token from the script properties (see setup function below)
    var scriptProperties = PropertiesService.getScriptProperties();
    var authToken = scriptProperties.getProperty('AUTH_TOKEN');

    // Prompt you for your auth token, then store in the script properties
    // Note that the prompt happens in the containing spreadsheet, not in the script editor!
    function setup() {
        var ui = SpreadsheetApp.getUi();
        var result = ui.prompt(
            'Apply a tag to segment members',
            'Enter your Intercom auth token:',
            ui.ButtonSet.OK_CANCEL);

        // Process the user's response.
        var button = result.getSelectedButton();
        var text = result.getResponseText();
        if (button == ui.Button.OK) {
            var scriptProperties = PropertiesService.getScriptProperties();
            scriptProperties.setProperty('AUTH_TOKEN', text);
        }
    }

    // Verify everything is ready to go
    function ready() {
        if (target && desiredTag && segmentId && authToken && ownerEmail) {
            return;
        } else if (!authToken) {
            setup(); // prompt for auth token in the spreadsheet
        } else if (!ownerEmail) {
            throw new Error("Add your email address so you can be notified of errors.");
        } else {
            MailApp.sendEmail(ownerEmail, "Error: Intercom script cannot run yet", "You are missing some key details. Please add them.");
            throw new Error("The script can't run without the required details.");
        }
    }

    // Retrieve an array of Intercom companies/users from a specific segment
    function getSegment() {
        try {
            var url = "https://api.intercom.io/" + target + "?segment_id=" + segmentId;

            var headers = {
                "Accept": "application/json",
                "Authorization": "Bearer " + authToken
            };

            var options = {
                "method": "get",
                "headers": headers
            };

            var response = UrlFetchApp.fetch(url, options);
            var segment = JSON.parse(response)[target];
            return segment;

        } catch (e) {
            MailApp.sendEmail(ownerEmail, "Error: could not retrieve " + target, e.message);
        }
    }

    // Apply a tag to an array of user or company IDs
    function applyTag(blob) {
        try {
            var entities = blob;
            var url = "https://api.intercom.io/tags";

            var headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + authToken
            };

            var options = {
                "method": "post",
                "headers": headers,
                "payload": entities
            };

            var response = UrlFetchApp.fetch(url, options);
            return response;
        } catch (e) {
            MailApp.sendEmail(ownerEmail, "Error: could not apply " + desiredTag, e.message);
        }
    }

    // Run the show or fail gracefully if any of the required variables are missing
    ready();

    // get the list of entities as a JSON object
    var intercomData = getSegment();

    // proceed only if there are members of the segment
    if (intercomData.length > 0) {

        // turn the object into an array of user/company IDs
        var items = [];
        for (var i = 0; i < intercomData.length; i++) {
            items[i] = {};
            items[i]["id"] = intercomData[i]["id"];
        }

        // prepare the Intercom API object
        var applyList = {};
        applyList["name"] = desiredTag;
        applyList[target] = items;
        applyList = JSON.stringify(applyList);

        // apply the tag
        applyTag(applyList);

        var jobResult = "updated " + items.length + " " + target + ".";
        var msg = "Applied " + desiredTag + " to the following " + target + ": \n\n" + items; 
    } else {
        var jobResult = "did not apply any tags.";
        var msg = "";
    }

  sendResultEmails === true ? MailApp.sendEmail(ownerEmail, "Intercom script run: " + jobResult, msg) : null;
}