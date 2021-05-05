// export default null;
// declare var self: ServiceWorkerGlobalScope;
self.addEventListener('install', async (event) => {
    return null;
})

self.addEventListener('activate', async () => {
    showLocalNotification("FOOB", "IS LIVE OR SOMETHING 🌽🌽")
})

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(async function() {
        const cache = await caches.open('v1');
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
            event.waitUntil(cache.add(event.request));
            return cachedResponse;
        }

        const response = await fetch(event.request);
        if (!response.ok) {
            throw new TypeError('bad response status');
        }
        cache.put(event.request, response.clone());

        return response;
    }());
});

const updateInterval = setInterval(async() => {
    const cache = await caches.open('v1');
    const request = new Request(`${self.location.origin}/api/?maxHoursUpcoming=24`, { method: 'GET' }); // Cache api
    const response = await fetch(request)

    if (response.status === 200 && (await response.clone().json())?.length) {
        cache.put(request, response);
    }

    checkForUpcomingStreamsNotifications()
}, 1 * 60 * 1000)

const checkForUpcomingStreamsNotifications = async () => {
    showLocalNotification()
}
const showLocalNotification = (title = "FOOB", body = "Test") => {
    const options = {
        body,
        /*
        #TODO
        */
    };
    self.registration.showNotification(title, options);
}