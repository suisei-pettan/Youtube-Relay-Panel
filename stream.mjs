import { readFileSync } from "fs";
import { createServer } from "https";
import { Server } from "socket.io";

const httpServer = createServer({
  key: readFileSync("/path/to/my/key.pem"),
  cert: readFileSync("/path/to/my/cert.pem")
});

const io = new Server(httpServer, { /* options */ });

io.on("connection", (socket) => {
  socket.on('pushurl', (data) => {
    if (!data.url.includes('share')) {
      socket.emit('not-standard-link', '请使用YouTube分享链接');
    } else {
      const urls = fs.readFileSync('/www/urls.txt', 'utf8');
      if (urls.includes(data.url)) {
        socket.emit('broadcasted', '此直播已转播');
      } else {
        const command = `python3 ${data.url} ${data.stream_link}`;
        // execute command
      }
    }
  });
});

httpServer.listen(2083);
