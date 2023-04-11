import { readFileSync } from "fs";
import { createServer } from "https";
import { Server } from "socket.io";
import { exec } from 'child_process';

const httpServer = createServer({
  key: readFileSync("/www/server/panel/ssl/privateKey.pem"),
  cert: readFileSync("/www/server/panel/ssl/certificate.pem")
});

const io = new Server(httpServer, { /* options */
  cors: {
    origin: "https://btiowaifu.github.io"
  }
});

io.on("connection", (socket) => {
  socket.on("danmaku", (arg) => {
    var pattern = /.*(吹雪|笨蛋).*/;
    var danma = JSON.parse(arg);
    if(pattern.test(danma.text)){
	console.log(pattern.test(danma.text));
    }else{
	console.log(danma.text);
    var channel=danma.ch;
    io.emit("danmaku"+channel, arg);
    }
  });
  socket.on('pushurl', (data) => {
    if (!data.url.includes('you')) {
      socket.emit('not-standard-link', '请使用YouTube分享链接');
    } else {
      console.log(readFileSync('/www/urls.txt', 'utf8'));
      const urls = readFileSync('/www/urls.txt', 'utf8');
      if (urls.includes(data.url)) {
        socket.emit('broadcasted', '此直播已转播');
      } else {
        //const command = `python3 /www/streambackend.py ${data.url} ${data.stream_link}`;
        console.log('python3 /www/streambackend.py ' + data.url + ' ' +'"'+ data.stream_link+'"');
        exec('python3 /www/streambackend.py ' + data.url + ' ' +'"'+ data.stream_link+'"');
        // execute command
      } 
    }
  });
});
httpServer.listen(2083);
