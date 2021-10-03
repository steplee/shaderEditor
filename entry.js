var url = require('url')
var budo = require('budo')
var fs = require('fs')
var fsPromises = require('fs/promises')

global.curPromise = null;
global.curLive = null;

var app = budo('./app.js', {
  //watchGlob: 'src/**',
  middleware: function (req, res, next) {
    let pathname = url.parse(req.url).pathname

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

    } else if (pathname.endsWith('keepLive')) {
      //console.log('handle KeepLive')
      global.curLive = res;
      //global.curPromise = new Promise();
      //res.statusCode = 200;
      //res.end('1.');

    } else if (pathname.startsWith('/proj/')) {
      fs.readFile('show.html', (err,data) => {
        if (err) {res.statusCode=404; res.end("show.html not found...");}
        res.statusCode = 200
        res.end(data)
      })

    } else {
      console.log('404',pathname)
      // fall through to other routes
      // -->: There is a default route that handles regular http requests (e.g. script src from html)
      next()
    }
  }
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
})

app.watch('src/**');
app.on('watch', function(ev, file) {
  console.log('watched',ev,file);

  let res = global.curLive;
  fs.readFile(file, {'encoding':'utf8'}, (err,data) => {
    if (err) {res.statusCode=404; res.end();}
    res.statusCode = 200
    let name = file.split('/'); name = name[name.length-1];
    name = name.split('.')[0];
    let msg = JSON.stringify({"name":name, "data":data});
    //console.log("sending",msg)
    res.end(msg)
  })
});
