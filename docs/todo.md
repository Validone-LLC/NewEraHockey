# TODO

## Error from local dev:
(node:151308) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Request from ::1: GET /.netlify/functions/calendar-events?type=camp
🔧 Local dev mode: Using Application Default Credentials
Request from ::1: GET /.netlify/functions/calendar-events?type=camps
🔧 Local dev mode: Using Application Default Credentials
Request from ::1: GET /.netlify/functions/calendar-events?type=camp
🔧 Local dev mode: Using Application Default Credentials
Request from ::1: GET /.netlify/functions/calendar-events?type=camps
🔧 Local dev mode: Using Application Default Credentials
Calendar API Error: Error: Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.
    at GoogleAuth2.getApplicationDefaultAsync (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\node_modules\google-auth-library\build\src\auth\googleauth.js:284:15)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at GoogleAuth2.#determineClient (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\node_modules\google-auth-library\build\src\auth\googleauth.js:764:36)      
    at GoogleAuth2.getClient (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\node_modules\google-auth-library\build\src\auth\googleauth.js:741:20)
    at Object.exports.handler (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\netlify\functions\calendar-events.js:68:22)
Calendar API Error: Error: Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.
    at GoogleAuth2.getApplicationDefaultAsync (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\node_modules\google-auth-library\build\src\auth\googleauth.js:284:15)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at GoogleAuth2.#determineClient (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\node_modules\google-auth-library\build\src\auth\googleauth.js:764:36)      
    at GoogleAuth2.getClient (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\node_modules\google-auth-library\build\src\auth\googleauth.js:741:20)
    at Object.exports.handler (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\netlify\functions\calendar-events.js:68:22)
Calendar API Error: Error: Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.
    at GoogleAuth2.getApplicationDefaultAsync (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\node_modules\google-auth-library\build\src\auth\googleauth.js:284:15)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at GoogleAuth2.#determineClient (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\node_modules\google-auth-library\build\src\auth\googleauth.js:764:36)      
    at GoogleAuth2.getClient (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\node_modules\google-auth-library\build\src\auth\googleauth.js:741:20)
    at Object.exports.handler (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\netlify\functions\calendar-events.js:68:22)
Calendar API Error: Error: Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.
    at GoogleAuth2.getApplicationDefaultAsync (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\node_modules\google-auth-library\build\src\auth\googleauth.js:284:15)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at GoogleAuth2.#determineClient (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\node_modules\google-auth-library\build\src\auth\googleauth.js:764:36)      
    at GoogleAuth2.getClient (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\node_modules\google-auth-library\build\src\auth\googleauth.js:741:20)
    at Object.exports.handler (C:\Users\Validone\AppData\Local\Temp\tmp-151308-SyRDB31PA0HJ\file:\P:\Repos\newerahockey\netlify\functions\calendar-events.js:68:22)
Response with status 500 in 3272 ms.
Response with status 500 in 2325 ms.
Response with status 500 in 2321 ms.
Response with status 500 in 2317 ms.
(node:151308) MetadataLookupWarning: received unexpected error = All promises were rejected code = UNKNOWN
(node:151308) MetadataLookupWarning: received unexpected error = All promises were rejected code = UNKNOWN
(node:151308) MetadataLookupWarning: received unexpected error = All promises were rejected code = UNKNOWN
(node:151308) MetadataLookupWarning: received unexpected error = All promises were rejected code = UNKNOWN



## From PR branch
https://deploy-preview-25--super-fenglisu-968777.netlify.app/schedule

I'm getting:
Page not found
Looks like you’ve followed a broken link or entered a URL that doesn’t exist on this site.

If this is your site, and you weren’t expecting a 404 for this path, please visit Netlify’s “page not found” support guide for troubleshooting tips.

## When new build gets deployed
I noticed when I deploy my build, the prod site will go down for all users unless they back to newerahockeytraining.com/, like the root, it doesn't auto-refresh the correct version? Doesn't make sense. So all they see is:
Page not found
Looks like you’ve followed a broken link or entered a URL that doesn’t exist on this site.

If this is your site, and you weren’t expecting a 404 for this path, please visit Netlify’s “page not found” support guide for troubleshooting tips.

