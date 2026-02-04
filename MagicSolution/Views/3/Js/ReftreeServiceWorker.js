var hostsToAddSub = [{ host: "reftree", sub: "/servizi3/reftree2roma" }, { host: "preprod.comune.roma.it", sub: "/servizi3/reftree2roma" }]; //insert here the hosts  
const versionPattern = /\/version\d+\.\d+\.\d+\//;
const magicImagesPattern = /\/Magic\/Images\//; 
const magicStylesPattern = /\/Magic\/Styles\//; 
const viewsPattern = /\/Views\/3\//; 
const magicSaveFilePattern = /\/api\/MAGIC_SAVEFILE\//; 
const excludedPaths = [
    '/Views/AccountImages/developer.jpg',
    '/Views/3/Styles/reftree.css',
    '/Views/3/Styles/bootstrap-to-kendo-style.css',
    '/WebResource.axd',
    '/Magic/Styles/kendo_ilos_images/loading_transparent_image.gif',
    '/Views/3/Z_ServiceWorkerInitPage_ComuneRoma.html',
    '/Views/3/SSOLogOut.html'
];


var counter = 0;
self.addEventListener('install', e => {//  e.waitUntil(installAsync()) 
    e.waitUntil(self.skipWaiting()); //immediately activate the worker...
});

self.addEventListener('activate', e => { //e.waitUntil(activateAsync()) 
    e.waitUntil(self.clients.claim());  //activate without waiting
});
self.addEventListener('fetch', async (e) => { await e.respondWith(processRequest(e)); });
self.addEventListener('error', e => {
    console.error('Error event', e);
});

async function processRequest(event) {
    if (event.request.url.includes("/login") && !event.request.url.includes("/login-soft"))
        return fetch(event.request);
    //overwrite the request here...
    const url = new URL(event.request.url);

    const host = url.host;
    var sub = hostsToAddSub.find((x) => x.host == host)?.sub;
    //if in the cookies there is no X-Reftree-MagicSolution key, make the call without any additional logic

    try {
        const headerValue = event.request.headers.get('X-Magicsolution-Reftree');
        // if the call comes from magicframework or contains "/servizi3/reftree2roma/"
        if (
            (!headerValue) &&
            !versionPattern.test(url.pathname) &&
            !excludedPaths.includes(url.pathname) &&
            !magicImagesPattern.test(url.pathname) &&
            !magicStylesPattern.test(url.pathname) &&
            !magicSaveFilePattern.test(url.pathname) &&
            !viewsPattern.test(url.pathname) &&
            !url.pathname.startsWith('/app') // Added check to ensure pathname does not start with /app#
        ) {
            return fetch(event.request);
        }

    }
    catch (err) {
        return fetch(event.request);
    }

 

    //if (sub && (!url.pathname.includes(sub) || urlNew)) {
    if (sub && !url.pathname.includes(sub)) {
        url.pathname = sub + url.pathname;
        //let newUrl =urlNew || url.toString();
        let newUrl = url.toString();

        try {

            if (event.request.mode == 'navigate'
                && event.request.method != "POST")  //exclude $.fileDownload case
            //&& event.request.url.indexOf("/GENERICSQLCOMMAND/ExportTofile/") == -1) 
            {
                const modRequest = new Request(newUrl);
                // Forward the modified request
                return fetch(modRequest);
            }


            // Check if the request body is a readable stream
            else if (event.request.body instanceof ReadableStream
                && event.request.mode != "navigate") {//exclude jQuery.fileDownload case
                //let data = await event.request.json();
                //data = JSON.stringify(data);
                let data = await event.request.text();

                // Create a new Request object with the modified URL and the new ReadableStream
                const modifiedRequest = new Request(url.toString(), {
                    method: event.request.method,
                    headers: event.request.headers,
                    body: data, // readableStream,
                    cache: event.request.cache,
                    credentials: event.request.credentials,
                    integrity: event.request.integrity,
                    keepalive: event.request.keepalive,
                    mode: event.request.mode,
                    redirect: event.request.redirect,
                    referrer: event.request.referrer,
                    referrerPolicy: event.request.referrerPolicy,
                    signal: event.request.signal
                });

                // Forward the modified request
                return fetch(modifiedRequest);
            }

            // Clone the original request
            const clonedRequest = event.request.clone();
            const modifiedRequest = new Request(newUrl, {
                method: clonedRequest.method,
                headers: clonedRequest.headers,
                body: clonedRequest.body,
                cache: clonedRequest.cache,
                credentials: clonedRequest.credentials,
                integrity: clonedRequest.integrity,
                keepalive: clonedRequest.keepalive,
                mode: clonedRequest.mode,
                redirect: clonedRequest.redirect,
                referrer: clonedRequest.referrer,
                referrerPolicy: clonedRequest.referrerPolicy,
                signal: clonedRequest.signal,
            });

            // Forward the modified request
            return fetch(modifiedRequest);
        }
        catch (ex) {
            console.log(newUrl);
            // return fetch(event.request);
        }
    }
    return fetch(event.request);

}

