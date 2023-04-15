import subprocess
import sys
import os
import time
import json
import ast


def main():
    # 获取启动参数
    youtube_url = sys.argv[1]
    channel_number = sys.argv[2]

    # 写入 youtube_url 至 txt 文件中
    with open("/www/urls.txt", "a") as file:
        file.write(youtube_url + "\n")

    while True:
        # 执行 ytdl-patched -g 获取视频链接
        ytdl_patched_output = subprocess.check_output(
            f"ytdl-patched -g {youtube_url}", shell=True)
        source_live = ytdl_patched_output.decode().strip()

        # 执行 ffmpeg
        ffmpeg_command = f'ffmpeg -loglevel quiet -i {source_live} -c:v copy -c:a aac -b:a 600k -ar 44100 -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 10 -strict -2 -f flv \"{channel_number}\"'
        p = subprocess.Popen(ffmpeg_command, shell=True)
        print(os.getpid())
        # 等待5.5小时后停止进程
        time.sleep(19800)

        # 删除已经处理过的 youtube_url
    with open("/www/urls.txt", "r") as file:
        urls = file.readlines()
    with open("/www/urls.txt", "w") as file:
        for url in urls:
            if url.strip() != youtube_url:
                file.write(url)

if __name__ == "__main__":
    main()