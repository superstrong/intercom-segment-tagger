
# How to tag a user or company when it joins an Intercom segment

Using Google Apps Script to automatically find users and apply the desired tag — for free.

Between Intercom’s own webhook events and Zapier’s integrated triggers, you can monitor for just about anything in Intercom.

**But it’s not currently possible to trigger automation when an entity becomes a member of a segment.**

Instead, using a Google Apps Script and a free auth token from Intercom, it’s possible to use Intercom’s API to periodically retrieve any new members of a specific segment and apply a tag, enabling operational automation and enhanced reporting.

### Tools

* Your Intercom account

* Google Sheets (Google Script)

* [This script](https://github.com/superstrong/intercom-segment-tagger/blob/master/intercom-segment-tagger.gs)

## Intercom

### Developer Section

Let’s get an auth token. This provides API access to your own Intercom data.

1. [Create an Intercom developer workspace](https://app.intercom.com/a/developer-signup). You should be able to use your existing Intercom account.

1. [Create an app](https://app.intercom.com/a/apps/_/developer-hub). Name it something simple like “Internal tagging script”. It won’t be distributed anywhere.

1. Make sure it’s set to use the API version 2.0 or higher (as of 2020–03–02).

1. Click “Authentication” in the left sidebar, then look at the top of the page and find the section called “Access Token.” Copy the really long string shown there and paste it somewhere for the moment. You’ll use it later.

![](https://cdn-images-1.medium.com/max/3772/1*zAcOq6MGsvVnF5wH8cbxng.png)

### Business Section

1. Which segment do you want to monitor? Find it in the UI ([people](https://app.intercom.io/a/apps/_/settings/people-segments)/[companies](https://app.intercom.io/a/apps/_/settings/company-segments)) and **click the link** to the right to view the users/companies in it.

1. We’ll only need to retrieve users who don’t yet have the tag we’ll be applying. Add one more filter to the current view: look for anything that *doesn’t* already have the tag you’ll be applying soon. Then click “Save segment” and save this as a new segment.

1. View your new segment and note the ID at the end of the URL. Keep that somewhere handy.

![](https://cdn-images-1.medium.com/max/2384/1*JpVQhehpV8dWXo9punL6Nw.png)

## Google Sheets

### Setup

1. Create a new Google Sheet

1. Navigate to Tools → Script editor

1. Give your code project a name — something simple like “Intercom tagger.”

1. You are staring at a nearly empty document called “Code.gs.” Highlight the code you see and delete it. Replace it with the [code shown here](https://github.com/superstrong/intercom-segment-tagger/blob/master/intercom-segment-tagger.gs2).

1. Fill in all the details at the top here inside the quotes next to each variable (see example below). You don’t need your auth token quite yet — but you will in the next section. When you’re finished, select File →Save or press the tiny diskette icon in the menubar.

```
    var target = "companies"; // change to "contacts" if desired
    var desiredTag = "New Tag 1";
    var segmentId = "5c1d18fddf74c998cb0a9dcd";
    var ownerEmail = "you@yourcompany.com";
    var sendResultEmails = true;
```

### Run it!

![](https://cdn-images-1.medium.com/max/2000/1*JUyqrJTkO2eOgT6bb8vPjA.png)

1. You should see a little playbar at the top next (see image). This is the way to manually run any of the top-level functions in the code. This entire script is wrapped as a function named “intercomTagger,” so go ahead and run it.

1. Google will probably prompt you to give permission to the script to act on your behalf in a few ways. Say yes.

1. Now it will appear nothing is happening. That’s because a prompt has opened up in the original Google Sheet, asking you to enter your auth token. Go back to that sheet and enter it!

1. Come back to the script. If all goes well, it will run for a bit, then stop. If you left that last variable above as sendResultsEmail=true, you’ll have an email in your inbox stating what happened.

### Automate it!

Ready to have this run for you all the time?

Apps Scripts can trigger themselves on a schedule, similar to what you might hear developers refer to as a [cron job](https://en.wikipedia.org/wiki/Cron). You can now set up a trigger to run every *x* minutes/hours all by itself.

1. Select Edit →Current project’s triggers, or press the tiny clock icon in the menubar.

1. Press “Add trigger” (bottom right) and select your settings in the modal, then save it. That’s it! Here’s an example:

![](https://cdn-images-1.medium.com/max/2552/1*pN-tINd1uvZuQY-qZwBsPQ.png)

## Known Limitations

If you have a ton of members in the segment, there’s a good chance the first call won’t get all of them. To get around this, just re-run the script manually.

API endpoints tend to split large chunks of data into “pages” of results — like a search results page in Google — and require API clients to page through the data incrementally. This script is not prepared to paginate through the results, so it will only ever handle the first page.

It’s relatively easy to possible to add pagination to the script, but that will also mean adding rate limiting, which is a way of making sure you don’t make too many requests too quickly of an API. Intercom has pretty aggressive rate limiting. All of which is to say, that would make a nice addition to the script if there’s demand for it.

## Questions and Requests

Submit an issue or comment on an existing one.
