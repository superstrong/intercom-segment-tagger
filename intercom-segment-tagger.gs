function intercomTagger() {

  // Make it your own
  var target = "contacts"; // set to either "contacts" or "companies"
  var desiredTag = ""; // e.g., "New Tag 1". tag name must match existing tag exactly or a new tag will be created
  var segmentId = ""; // e.g., "5c1d18fddf74c998cb0a9dcd" get this from the URL while viewing a segment
  var ownerEmail = ""; // email address to notify of errors and optional script results
  var sendResultEmails = true; // true or false -- do you want to be notified every time the script runs?
  
  // ************************************
  // No need to touch anything below this
  // ************************************

  // ************************************
  // Utilities
  // ************************************

  // Get the Intercom auth token from the script properties (see setup function below)
  var scriptProperties = PropertiesService.getScriptProperties();
  var authToken = scriptProperties.getProperty('AUTH_TOKEN');
  
  // Prompt you for your auth token, then store in the script properties
  // Note that the prompt happens in the containing spreadsheet, not in the script editor!
  function setup() {
    Logger.log("Running setup.");
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
    Logger.log("Initiating script.");
    if (target && desiredTag && segmentId && authToken && ownerEmail) {
      if (target != "contacts" && target != "companies") {
        throw new Error("Must set target to either companies or contacts.");
      } else {
        return;
      }
    } else if (!authToken) {
      setup(); // prompt for auth token in the spreadsheet
    } else if (!ownerEmail) {
      throw new Error("Add your email address so you can be notified of errors.");
    } else {
      MailApp.sendEmail(ownerEmail, "Error: Intercom script cannot run yet", "You are missing some key details. Please add them.");
      throw new Error("The script can't run without the required details.");
    }
  }
  
  // Retrieve an array of Intercom contacts from a specific segment
  function getContactsSegment() {
    Logger.log("Getting the contacts segment " + segmentId + ".");
    try {
      var url = "https://api.intercom.io/contacts/search";
      
      var headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + authToken
      };
      
      var payload = {
        "query": {
          "field": "segment_id",
          "operator": "=",
          "value": segmentId
        }
      };
      
      var options = {
        "method": "post",
        "headers": headers,
        "payload": JSON.stringify(payload),
        "muteHttpExceptions": true
      };
      
      var response = UrlFetchApp.fetch(url, options);
      var segment = JSON.parse(response)["data"];
      return segment;
      
    } catch (e) {
      MailApp.sendEmail(ownerEmail, "Error: could not retrieve " + target, e.message);
    }
  }
  
  // Retrieve an array of Intercom companies from a specific segment
  function getCompaniesSegment() {
    Logger.log("Getting the companies segment " + segmentId + ".");
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
  
  function updateTags() {
    Logger.log("Updating the list of tags.");
    try {
      var url = "https://api.intercom.io/tags";
      
      var headers = {
        "Accept": "application/json",
        "Authorization": "Bearer " + authToken
      };
      
      var options = {
        "method": "get",
        "headers": headers,
        "muteHttpExceptions": true
      };
      
      var response = UrlFetchApp.fetch(url, options);
      var allTags = JSON.parse(response)["data"];
      var scriptProperties = PropertiesService.getScriptProperties();
      scriptProperties.setProperty('TAGS', JSON.stringify(allTags));
      
    } catch (e) {
      MailApp.sendEmail(ownerEmail, "Error: unable to retrieve the list of all tags from Intercom.", e.message);
    }
  }
  
  function getTagId(tagName) {
    Logger.log("Getting the tag ID by tag name.");
    var scriptProperties = PropertiesService.getScriptProperties();
    var storedTags = JSON.parse(scriptProperties.getProperty('TAGS'));
    var tagId = null;
    for (var i = 0; i < storedTags.length; i++) {
      if (storedTags[i]["name"] == desiredTag) {
        var tagId = storedTags[i]["id"];
      }
    }
    return tagId;
  }
  
  // Apply a tag to an array of contact IDs
  function applyContactsTag(blob,tagId) {
    Logger.log("Applying the tag " + desiredTag + " to the contacts.");
    for (var j = 0; j < blob.length; j++) {
      var currentContactId = blob[j];
      try {
        var entities = {"id": tagId};
        var url = "https://api.intercom.io/contacts/" + currentContactId + "/tags";
        
        var headers = {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": "Bearer " + authToken
        };
        
        var options = {
          "method": "post",
          "headers": headers,
          "payload": JSON.stringify(entities),
          "muteHttpExceptions": true
        };
        
        var response = UrlFetchApp.fetch(url, options);
      } catch (e) {
        MailApp.sendEmail(ownerEmail, "Error: could not apply " + desiredTag, e.message);
      }
    }
  }

  // Apply a tag to an array of company IDs
  function applyCompaniesTag(blob) {
    Logger.log("Applying the tag " + desiredTag + " to the companies.");
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
        "payload": JSON.stringify(entities),
        "muteHttpExceptions": true
      };
      
      var response = UrlFetchApp.fetch(url, options);
    } catch (e) {
      MailApp.sendEmail(ownerEmail, "Error: could not apply " + desiredTag, e.message);
    }
  }
  
  function createCompaniesPayload() {
    Logger.log("Creating the companies payload for the Intercom POST.");
    // verify the retrieval worked
    if (!intercomData) {
      throw new Error("Something went wrong when retrieving the " + target + " segment from Intercom.");
    } else if (intercomData.length > 0) { // proceed only if there are members of the segment
      
      Logger.log("Building the companies items array.");
      // turn the segment into an array of user/company IDs
      var items = [];
      for (var i = 0; i < intercomData.length; i++) {
        items[i] = {};
        items[i]["id"] = intercomData[i]["id"];
      }
      Logger.log("Companies items: " + items);
      
      // prepare the Intercom API object
      var applyList = {};
      applyList["name"] = desiredTag;
      applyList[target] = items;
      return applyList;
    } else {
      var jobResult = "did not apply any tags.";
      var msg = "";
      return;
    }
  }

  function createContactsPayload() {
    Logger.log("Creating the contacts payload for the Intercom POST.");
    // verify the retrieval worked
    if (!intercomData) {
      throw new Error("Something went wrong when retrieving the " + target + " segment from Intercom.");
    } else if (intercomData.length > 0) { // proceed only if there are members of the segment
      
      // turn the segment into an array of user/company IDs
      Logger.log("Building the contacts items array.");
      var items = [];
      for (var i = 0; i < intercomData.length; i++) {
        items[i] = intercomData[i]["id"];
      }
      Logger.log("Contacts items: " + items);
      
      // prepare the Intercom API object
      var applyList = items
      return applyList;
    } else {
      var jobResult = "did not apply any tags.";
      var msg = "";
      return;
    }
  }

  // ************************************
  // The action
  // ************************************

  // Run the show or fail gracefully if any of the required variables are missing
  ready();
  
  // get the list of entities as a JSON object
  if (target === "companies") {
    Logger.log("The target is companies.");
    var intercomData = getCompaniesSegment();
    var applyList = createCompaniesPayload();
    if (!applyList) {
      Logger.log("There is no list of companies to update.");
      return;
    }
    applyCompaniesTag(applyList);  
  } else if (target === "contacts") {
    Logger.log("The target is contacts.");
    var intercomData = getContactsSegment();
    var applyList = createContactsPayload();
    if (!applyList) {
      Logger.log("There is no list of contacts to update.");
      return;
    }
    
    // Attempt to get the tag ID. If it doesn't exist, update the list of tags and try once more.
    var getTagIdSuccess = false;
    for (var t = 0; t < 2; t++) {
      var desiredTagId = getTagId(desiredTag);
      if (desiredTagId) {
        Logger.log("Found the tag ID.");
        getTagIdSuccess = true;
        applyContactsTag(applyList,desiredTagId);
        t = 2;
      } else {
        Logger.log("Did not find the tag ID. Updating the tags list.");
        updateTags();
      }
    }
    if (!getTagIdSuccess) {
      throw new Error("Could not find any ID for that tag name. Verify the tag name exists and retry.");
    }
  }
    
  var jobResult = "updated the " +  target + ".";
  var msg = "Applied the " + desiredTag + " tag to the " + target + ".";
  sendResultEmails === true ? MailApp.sendEmail(ownerEmail, "Intercom script run: " + jobResult, msg) : null;
}