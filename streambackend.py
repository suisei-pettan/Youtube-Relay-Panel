import subprocess
import sys
import os
import time


def main():
    # 获取启动参数
    youtube_url = sys.argv[1]
    channel_number = sys.argv[2]
    next_start_time = time.monotonic()

    while True:
        # 获取当前时间
        current_time = time.monotonic()

        if current_time >= next_start_time:
            # 执行 ytdl-patched -g 获取视频链接
            ytdl_patched_output = subprocess.check_output(
                [f"ytdl-patched -g {youtube_url}"], shell=True)
            source_live = ytdl_patched_output.decode().strip()

            # 执行 ffmpeg
            ffmpeg_command = f'ffmpeg -loglevel quiet -i {source_live} -c:v copy -c:a aac -b:a 600k -ar 44100 -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 10 -strict -2 -f flv \"{channel_number}\"'
            p = subprocess.Popen(ffmpeg_command, shell=True)
            print(os.getpid())

            # 计算下一次程序运行时间（50m - 程序执行时间）
            next_start_time = current_time + 60 * 50 - time.monotonic() + next_start_time

        # 每分钟检查一次是否到了重启时间
        time.sleep(60)

        # 判断当前时间是否到了重启时间
        current_time = time.monotonic()
        if current_time >= next_start_time:
            p.kill()
            p.wait()
            os.execl(sys.executable, sys.executable, *sys.argv)

if __name__ == "__main__":
    main()
