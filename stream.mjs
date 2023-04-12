import { readFileSync, writeFileSync } from "fs";
import { createServer } from "https";
import { Server } from "socket.io";
import { exec } from "child_process";

const httpServer = createServer({
  key: readFileSync("/www/server/panel/ssl/privateKey.pem"),
  cert: readFileSync("/www/server/panel/ssl/certificate.pem"),
});

const io = new Server(httpServer, {
  /* options */
  cors: {
    origin: "https://btiowaifu.github.io",
  },
});

let pidList = [];

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
  socket.on("danmaku", (arg) => {
    var pattern = /.*(吹雪|笨蛋).*/;
    var danma = JSON.parse(arg);
    if (pattern.test(danma.text)) {
      console.log(pattern.test(danma.text));
    } else {
      console.log(danma.text);
      var channel = danma.ch;
      io.emit("danmaku" + channel, arg);
    }
  });
  socket.on("pushurl", (data) => {
    if (!data.url.includes("you")) {
      socket.emit("not-standard-link", "请使用YouTube分享链接");
    } else {
      console.log(readFileSync("/www/urls.txt", "utf8"));
      const urls = readFileSync("/www/urls.txt", "utf8");
      if (urls.includes(data.url)) {
        socket.emit("broadcasted", "此直播已转播");
      } else {
        console.log('python3 /www/streambackend.py ' + data.url + ' ' +'"'+ data.stream_link+'"');
        exec('python3 /www/streambackend.py ' + data.url + ' ' +'"'+ data.stream_link+'"', (error, stdout, stderr) => {
          if (error) {
            console.log(`error: ${error.message}`);
            return;
          }
          if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
        });
      }
    }
  });
  socket.on("close-stream", (value) => { // 监听 "close-stream" 事件
    const pidTxt = readFileSync("/www/pid.txt", "utf8").trim();
    for(var i =0;i<=pidTxt.length;i++){
        if(pidTxt[i][0]==value.stream_link){
            exec('kill -9 ' + pidTxt[i][1]);
            pidTxt.splice(i,1);
            fs.writeFile('/www/pid.txt', pidTxt);
        }else{
            console.log("无目标")
        }
    }
    console.log(`killing process ${pidToKill}`);
    
  });
});

httpServer.listen(2083);
