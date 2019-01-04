# Hotel Engine Node Test

Technical Assessment for Hotel Engine

## 🌋 Setup

```
$ npm install
$ npm start
$ npm run client
```

## 🧰 Tools

-   Hapi (including Inert and catbox)
-   nodemon
-   axios, request, and request-promise
-   webpack and babel
-   animejs (for some fun animations)

## 🧐 Thoughts

This was my first experience using Hapi; typically Express is my go-to framework. As this was a Node assessment, I figured using a new framework would allow me to rely more on my knowledge of the Node runtime then it did on library-specific code. All-in-all I was pretty happy with Hapi- I thought the out-of-the-box caching was a nice feature.

I intentionally kept things (file structure, task runners, compilers, etc.) simple. If I was to continue working on this project, I would probably migrate from the request HTTP client to a HTTP/2 solution (I believe this would speed things up a bit, since it would allow for concurrent requests on the same connection, but then again, I'm not sure if GitHub's endpoints is compatible).

Other next steps would be creating a test for the '/api/data' endpoint. I'd probably cache a response from GitHub and make sure the promise chain is returning the expected data. I also think I could be handling errors better: as of right now, I'm just redirecting everything to the home page.
