self.addEventListener('install', function (e) {
  // e.waitUntil(
  //   caches.open('langroutes').then(function (cache) {
  //     return cache.addAll([
  //       '/android-chrome-512x512.png'
  //     ])
  //   })
  // )
})

self.addEventListener('fetch', function(event) {
 // console.log(event.request.url);
});