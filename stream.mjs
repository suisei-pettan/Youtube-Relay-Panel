import {readFileSync, writeFileSync} from "fs";
import {createServer} from "https";
import {Server} from "socket.io";
import {exec, spawn, fork} from "child_process";

global.pid = [];


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
    socket.on('pushurl', (data) => {
        const {url, stream_link} = data;

        // 检查txt文件内是否存在与url一致的URL
        const checkUrlExists = (url) => {
            return new Promise((resolve, reject) => {
                const fileStream = fs.createReadStream('urls.txt');
                const rl = readline.createInterface({
                    input: fileStream,
                    crlfDelay: Infinity
                });

                rl.on('line', (line) => {
                    if (line === url) {
                        rl.close();
                        resolve(true);
                    }
                });

                rl.on('close', () => {
                    resolve(false);
                });

                rl.on('error', (err) => {
                    reject(err);
                });
            });
        };

        // 执行Python脚本并传递参数
        const executePythonScript = (url, stream_link) => {
            const pythonProcess = spawn('python3', [streambackendPath, url, stream_link]);

            pythonProcess.stdout.on('data', (data) => {
                // 处理脚本输出
                console.log(`stdout: ${data}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                // 处理脚本错误输出
                console.error(`stderr: ${data}`);
            });

            pythonProcess.on('close', (code) => {
                // 脚本执行完毕的回调函数
                console.log(`子进程退出，退出码 ${code}`);

                // 将url追加到txt文件中
                fs.appendFile('urls.txt', url + '\n', (err) => {
                    if (err) {
                        console.error('无法将URL写入文件:', err);
                    } else {
                        console.log('URL已追加到文件.');

                        // 向客户端发送"已推流"事件
                        socket.emit('streaming', '已推流');
                    }
                });
            });
        };

        // 检查txt文件内是否存在与url一致的URL
        checkUrlExists(url)
            .then((exists) => {
                if (exists) {
                    // 向客户端发送"已推流"事件
                    socket.emit('streaming', '已推流');
                    console.log('URL已推流');
                } else {
                    // 执行Python脚本并传递参数
                    executePythonScript(url, stream_link);
                }
            })
            .catch((error) => {
                console.error('检查URL时出错:', error);
            });
    });
    socket.on('close-stream', (url) => {
        // 执行stream_stop_event_sender.py脚本并传递参数
        const pythonProcess = spawn('python3', [streamStopEventSenderPath, url]);

        pythonProcess.stdout.on('data', (data) => {
            // 处理脚本输出
            console.log(`stdout: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            // 处理脚本错误输出
            console.error(`stderr: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            // 脚本执行完毕的回调函数
            console.log(`子进程退出，退出码 ${code}`);
        });
    });
});
httpServer.listen(2083);
