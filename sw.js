// Code originally from https://blog.heroku.com/how-to-make-progressive-web-app
//

self.addEventListener("install", (event) => {
  console.debug("Installing web app");
  event.waitUntil(preLoad());
});

const preLoad = () => {
  console.debug("Preloading web app");
  return caches.open("offline").then((cache) => {
    console.debug("Caching...");
    return cache.addAll(["./css/", 
                         "./img/", 
                         "./js/", 
                         "./snd/",
                         "./index.html", 
                         "./offline.html",
                         "./workout.html", 
                         "./about.html",
                         "./favicon.ico",
                         "./manifest.json"
    ]);
  });
};

self.addEventListener("fetch", (event) => {
  console.debug(`Intercepting fetch request for ${event.request.url}`);
  event.respondWith(checkResponse(event.request).catch(() => {
    return returnFromCache(event.request);
  }));
  event.waitUntil(addToCache(event.request));
});

const checkResponse = (request) => {
  return new Promise((fulfill, reject) => {
    fetch(request).then((response) => {
      if (response.status !== 404) {
        fulfill(response);
      } else {
        reject();
      }
    }, reject);
  });
};

const addToCache = (request) => {
  return caches.open("offline").then((cache) => {
    return fetch(request).then((response) => {
      console.debug(response.url + " was cached");
      return cache.put(request, response);
    });
  });
};

const returnFromCache = (request) => {
  return caches.open("offline").then((cache) => {
    return cache.match(request).then((matching) => {
      if (!matching || matching.status == 404) {
        return cache.match("offline.html");
      } else {
        return matching;
      }
    });
  });
};