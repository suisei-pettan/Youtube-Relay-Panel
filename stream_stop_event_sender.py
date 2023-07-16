import sys
import socket


def send_stop_event(url):
    # 创建 socket 连接
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        # 连接到服务器
        client_socket.connect(('localhost', 5000))

        # 发送停止事件，附带 URL 参数
        client_socket.send(url.encode('utf-8'))

    except ConnectionRefusedError:
        print("连接失败，请确认服务器正在运行并监听指定端口。")
        sys.exit(1)

    finally:
        # 关闭 socket 连接
        client_socket.close()


if __name__ == "__main__":
    # 获取启动参数
    if len(sys.argv) != 2:
        print("需要提供 URL 作为启动参数。")
        sys.exit(1)

    url = sys.argv[1]

    # 发送停止事件
    send_stop_event(url)
