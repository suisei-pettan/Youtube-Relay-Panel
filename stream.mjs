import { readFileSync, writeFileSync } from "fs";
import { createServer } from "https";
import { Server } from "socket.io";
import { exec, spawn,fork } from "child_process";

global.pid=[];


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
  global.urls=[];
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
      if (global.urls.includes(data.url)) {
        socket.emit("broadcasted", "此直播已转播");
      } else {
        global.urls.push(data.url);
        const args = [data.url, data.stream_link];

const process = spawn('python3', ['/www/streambackend.py', ...args],{ detached: true });


        // 获取进程的 PID
        const pid = process.pid;
        console.log(`The pid of the process is ${pid}.`);

        // 将进程 PID 添加到 global.pid 数组的第一列和第二列
        global.pid.push([data.stream_link, pid]);

        // 当进程退出时更新 global.pid 数组，删除原来存在的 PID 行
        process.on('exit', (code) => {
          const index = global.pid.findIndex((item) => item[0] === data.stream_link);
          if (index !== -1) {
            global.pid.splice(index, 1);
          }
        });
      }
    }
  });

socket.on("close-stream", (value) => {
  // 查找在 global.pid 数组中与 value.stream_link 相同的行，并获得该行在数组中的索引
  const index = global.pid.findIndex((item) => item[0] === value.stream_link);

  if (index !== -1) {
    // 从 global.pid 数组中获取当前行的 pid，并使用 kill -TERM 命令杀死进程
    const pidToKill = global.pid[index][1];
    exec(`kill -kill -- -${pidToKill}`, (error, stdout, stderr) => {
      if (error) {
        console.log(`kill process error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`kill process stderr: ${stderr}`);
        if (urlIndex !== -1) {
    // 从 global.urls 数组中删除当前项
    global.urls.splice(urlIndex, 1);
    console.log(`item with url ${value.url} removed from urls`);
  }
        return;
      }
      console.log(`process ${pidToKill} killed`);
    });

    // 从 global.pid 数组中删除当前行
    global.pid.splice(index, 1);
    console.log(`row with stream_link ${value.stream_link} removed from pid`);
  }

  // 查找在 global.urls 数组中与 value.url 相同的项，并获得该项在数组中的索引
  const urlIndex = global.urls.findIndex((url) => url === value.url);
});


});

httpServer.listen(2083);
