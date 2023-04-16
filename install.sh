#!/bin/bash

cd /www/wwwroot

# 更新仅仅update源
apt update -y
apt upgrade -y

# 安装 nodejs 和 npm
apt install -y nodejs npm

# 安装mjs代码中涉及的npm模块
npm install -g fs https socket.io child_process

# 下载文件 stream.mjs 到 /www/wwwroot
curl -O https://raw.githubusercontent.com/BTIOWaifu/Youtube-Relay-Panel/main/stream.mjs

# 下载文件 streambackend.py 到 /www
cd /www
curl -O https://raw.githubusercontent.com/BTIOWaifu/Youtube-Relay-Panel/main/streambackend.py

# 安装 python3
apt install -y python3

# 安装 ffmpeg
cd /root
apt update -y
apt install -y ffmpeg

# 下载 ytdl-patched
sudo curl -L https://github.com/ytdl-patched/ytdl-patched/releases/latest/download/ytdl-patched -o /usr/local/bin/ytdl-patched

# 授权 ytdl-patched 可执行权限
sudo chmod a+rx /usr/local/bin/ytdl-patched

# 移动 ssl 证书和密钥
echo "请把ssl证书移动到 /www/server/panel/ssl/certificate.pem，密钥移动到 /www/server/panel/ssl/privateKey.pem。防火墙开放2083端口。完成后按下任意键启动"
read -n 1 -s

cd /www/wwwroot

# 启动 stream.mjs
sudo nodejs stream.mjs &
