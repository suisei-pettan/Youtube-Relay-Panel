import subprocess
import sys
import mysql.connector
import os
import signal
import socket
import threading

def download_and_stream(url, stream_link):
    # 调用 yt-dlp 获取视频链接
    command_ytdlp = ['yt-dlp', '-g', url]
    result = subprocess.run(command_ytdlp, capture_output=True, text=True)
    video_url = result.stdout.strip()

    # 创建 FFmpeg 进程
    command_ffmpeg = ['ffmpeg', '-loglevel', 'quiet', '-i', video_url, '-c:v', 'copy', '-strict', '-2', '-f', 'flv', stream_link]

    while True:
        # 获取 Python 进程 ID
        python_pid = str(os.getpid())

        # 调用 FFmpeg 执行流媒体转发
        ffmpeg_process = subprocess.Popen(command_ffmpeg)

        # 获取 FFmpeg 进程 ID
        ffmpeg_pid = str(ffmpeg_process.pid)

        # 将数据写入 MySQL 数据库
        cnx = mysql.connector.connect(user='relay', password='123', database='relay', charset='utf8mb4')
        cursor = cnx.cursor()

        insert_query = "INSERT INTO streams (python_pid, ffmpeg_pid, url, stream_link) VALUES (%s, %s, %s, %s)"
        insert_values = (python_pid, ffmpeg_pid, url, stream_link)
        cursor.execute(insert_query, insert_values)

        cnx.commit()
        cursor.close()
        cnx.close()

        # 定义信号处理函数，在接收到 SIGCHLD 信号时删除数据库行
        def handle_signal(signum, frame):
            cnx = mysql.connector.connect(user='relay', password='123', database='relay', charset='utf8mb4')
            cursor = cnx.cursor()

            delete_query = "DELETE FROM streams WHERE python_pid = %s AND ffmpeg_pid = %s"
            delete_values = (python_pid, ffmpeg_pid)
            cursor.execute(delete_query, delete_values)

            cnx.commit()
            cursor.close()
            cnx.close()

            sys.exit(0)

        # 注册信号处理函数
        signal.signal(signal.SIGCHLD, handle_signal)

        # 创建 socket 用于监听推流停止事件
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.bind(('localhost', 5000))
        server_socket.listen(1)

        # 定义监听线程函数
        def listen_socket():
            while True:
                client_socket, address = server_socket.accept()
                received_stream_link = client_socket.recv(1024).decode('utf-8')
                if received_stream_link.strip() == stream_link:
                    # 停止 FFmpeg 进程
                    ffmpeg_process.terminate()
                    break

        # 启动监听线程
        listener_thread = threading.Thread(target=listen_socket)
        listener_thread.start()

        # 等待 FFmpeg 进程结束
        ffmpeg_process.wait()

        # 关闭 socket
        server_socket.close()

        # 删除数据库中的行
        cnx = mysql.connector.connect(user='relay', password='123', database='relay', charset='utf8mb4')
        cursor = cnx.cursor()

        delete_query = "DELETE FROM streams WHERE python_pid = %s AND ffmpeg_pid = %s"
        delete_values = (python_pid, ffmpeg_pid)
        cursor.execute(delete_query, delete_values)

        cnx.commit()
        cursor.close()
        cnx.close()

        # 检查 FFmpeg 进程的退出状态
        if ffmpeg_process.returncode == 0:
            # 正常终止，退出循环
            break
        else:
            # FFmpeg 异常终止，重新执行 yt-dlp 和 FFmpeg
            print("FFmpeg 进程异常终止，重新执行 yt-dlp 和 FFmpeg.")

    # 重新执行下载和流媒体转发
    download_and_stream(url, stream_link)

if __name__ == "__main__":
    # 获取启动参数
    if len(sys.argv) != 3:
        print("需要提供 URL 和 stream_link 作为启动参数。")
        sys.exit(1)

    url = sys.argv[1]
    stream_link = sys.argv[2]

    # 执行下载和流媒体转发
    download_and_stream(url, stream_link)
