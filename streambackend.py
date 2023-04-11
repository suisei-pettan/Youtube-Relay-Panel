import subprocess
import sys
import os

def main():
    # 获取启动参数
    youtube_url = sys.argv[1]
    channel_number = sys.argv[2]

    # 写入 youtube_url 至 txt 文件中
    with open("/www/urls.txt", "a") as file:
        file.write(youtube_url + "\n")

    # 执行 ytdl-patched -g youtube视频链接 获取其输出的链接存入 源直播 变量
    ytdl_patched_output = subprocess.check_output(f"ytdl-patched -g {youtube_url}", shell=True)
    source_live = ytdl_patched_output.decode().strip()
    # 执行 ffmpeg -loglevel quiet -i 源直播 -c:v copy -strict -2 -f flv rtmp://127.0.0.1/live/homo频道号.flv
    ffmpeg_command = f"ffmpeg -loglevel info -i {source_live} -c:v copy -strict -2 -f flv {channel_number}"
    subprocess.run(ffmpeg_command, shell=True)

    # 删除已经处理过的 youtube_url
    with open("/www/urls.txt", "r") as file:
        urls = file.readlines()
    with open("/www/urls.txt", "w") as file:
        for url in urls:
            if url.strip() != youtube_url:
                file.write(url)

if __name__ == "__main__":
    main()