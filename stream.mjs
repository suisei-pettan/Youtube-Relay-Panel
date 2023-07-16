import { readFileSync, writeFileSync } from "fs";
import { createServer } from "https";
import { Server } from "socket.io";
import { spawn } from "child_process";

global.pid = [];

const httpServer = createServer({
    key: readFileSync("/www/server/panel/ssl/privateKey.pem"),
    cert: readFileSync("/www/server/panel/ssl/certificate.pem"),
});

const io = new Server(httpServer, {
    /* options */
    cors: {
        origin: "https://suisei-pettan.github.io/",
    },
});

let pidList = [];

io.on("connection", (socket) => {
    global.urls = [];
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
        const { url, stream_link } = data;
        console.log("Received pushurl event with URL:", url);
        console.log("Received pushurl event with stream_link:", stream_link);

        // ... 其他代码 ...

        // 向客户端发送"已推流"事件
        socket.emit("streaming", "已推流");
        console.log("Sent streaming event to the client");
    });
    socket.on("close-stream", (stream_link) => {
        console.log("Received close-stream event with stream_link:", stream_link);

        // ... 其他代码 ...

        // 脚本执行完毕的回调函数
        console.log(`子进程退出，退出码 ${code}`);
    });
});

httpServer.listen(2053);
