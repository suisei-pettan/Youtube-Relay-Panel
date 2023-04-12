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

        // 添加关闭推流监听
        socket.on('closepush', (close_data) => {
          const stream_link_pid = readFileSync('/www/pid.txt', 'utf8');
          const stream_link_pid_array = stream_link_pid.trim().split('\n').map(item => item.trim().split(','));
          const pid_to_kill = stream_link_pid_array.find(item => item[0] === close_data.stream_link);

          if (pid_to_kill) {
            const pid = pid_to_kill[1];
            exec(`kill ${pid}`, (error, stdout, stderr) => {
              if (error) {
                console.error(`exec error: ${error}`);
                return;
              }
              console.log(`stdout: ${stdout}`);
              console.error(`stderr: ${stderr}`);
            });

            socket.emit('push-closed', '推流已关闭');
          } else {
            socket.emit('push-not-started', '该链接的推流未开启');
          }
        });
      } 
    }
  });
});
httpServer.listen(2083);
