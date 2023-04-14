import { readFileSync, writeFileSync } from "fs";
import { createServer } from "https";
import { Server } from "socket.io";
import { exec } from "child_process";

global.urls=[];

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
      if (global.urls.includes(data.url)) {
        socket.emit("broadcasted", "此直播已转播");
      } else {
        global.urls.push(data.url);
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

  // 获取Python进程PID和进程p的PID
        const [python_pid, p_pid] = stdout.trim().split('\n')[0].split(' ');

        console.log(`Python进程PID: ${python_pid}`);
        console.log(`进程p的PID: ${p_pid}`);
        if (!global.arr) {
  global.arr = [[python_pid, p_pid, data.stream_link]];
} else {
  global.arr.push([python_pid, p_pid, data.stream_link]);
}

console.log(global.arr);


  // 在这里可以将PID存储到二维数组的第一第二列中，具体方式取决于您的代码逻辑
        });

      }
    }
  });
  socket.on("close-stream", (value) => { // 监听 "close-stream" 事件
  if (global.arr) {
  const pidIndex = 1;
  const streamLinkIndex = 2;

  for (let i = global.arr.length - 1; i >= 0; i--) {
    const row = global.arr[i];
    if (row[streamLinkIndex] === value.stream_link) {
      // 找到包含 value.stream_link 的行，杀死其前两列中的PID
      const pythonPid = row[0];
      const pPid = row[pidIndex];
      exec(`kill -9 ${pythonPid} ${pPid}`, (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);

        // 从数组中删除这一行
        global.arr.splice(i, 1);
      });
    }
  }

  console.log(global.arr);
} else {
  console.log('global.arr is undefined or null');
}
if (global.urls) {
  const index = global.urls.indexOf(value.url);
  if (index !== -1) {
    global.urls.splice(index, 1);
    console.log(`已删除${value.url}`);
  } else {
    console.log(`${value.url}在global.urls中不存在`);
  }
} else {
  console.log(`global.urls不存在或为null`);
}

});


});

httpServer.listen(2083);
