var url = require('url')
var budo = require('budo')
var fs = require('fs')
var fsPromises = require('fs/promises')

var app = budo('./app.js', {
  middleware: function (req, res, next) {
    let pathname = url.parse(req.url).pathname
    console.log('get',pathname)

    if (pathname.endsWith('/data')) {
      console.log('Handling', pathname)
      let proj = pathname.split('/')[2];
      let baseDir = 'src/' + proj + '/'
      console.log(baseDir)
      let allPromises = [];
      let files = fs.readdirSync(baseDir);
      let obj = {'shaders':{}};
      for (const file of files) {

        if (file.endsWith('options')) {
          let pro = fsPromises.readFile(baseDir+file, {'encoding':'utf8'})
                      .then(d => {obj.options = d});
          allPromises.push(pro);

        } else if (file.endsWith('glsl')) {
          console.log('file',baseDir+file);
          const name = file.split('.')[0];
          let pro = fsPromises.readFile(baseDir+file, {'encoding':'utf8'})
                      .then(d => {obj.shaders[name] = d});
          allPromises.push(pro);
        }
      }
      Promise.all(allPromises).then((v) => {
        console.log('all promises fulfilled.');
        res.statusCode = 200
        res.end(JSON.stringify(obj));
      });

    } else if (pathname.startsWith('/proj/')) {
      fs.readFile('show.html', (err,data) => {
        if (err) {res.statusCode=404; res.end("show.html not found...");}
        res.statusCode = 200
        res.end(data)
      })
      /*
    } else if (
       pathname === '/main' ||
       pathname === '/bufferA' ||
       pathname === '/bufferB' ||
       pathname === '/bufferC') {
      res.statusCode = 200
      let srcFile = 'src/' + pathname.substr(1) + '.glsl'
      fs.readFile(srcFile, (err,data) => {
        if (err) {
          res.statuscode = 404
          res.end('No code for request ' + pathname + ' found. File "'+srcFile+'" does not exist.')
          console.log('no ' + srcFile)
        }
        res.statusCode = 200
        res.end(data)
      })
      */

    } else {
      console.log(pathname)
      // fall through to other routes
      // -->: There is a default route that handles regular http requests (e.g. script src from html)
      next()
    }
  }
})
