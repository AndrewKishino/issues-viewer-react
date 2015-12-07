# Github Issues Viewer

View Github issues. Built using React.

## To use

The server implementation serves static files from `public/` and handles requests to `/api/comments` to fetch or add data. Start a server with the following:

```sh
npm install
bower install
node server.js
```

And visit <http://localhost:3000/>.

## To contribute

All precompiled source files are located in the src/ folder. 

Install browserify

```sh
npm install -g browserify
```

and run gulp within the root of the directory

```sh
gulp
```

Gulp will browserify or compile any scripts and sass and watch for changes.