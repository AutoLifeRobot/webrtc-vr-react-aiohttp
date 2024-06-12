import cv2
from aiortc import VideoStreamTrack
from av import VideoFrame


class ImageVideoStreamTrack(VideoStreamTrack):
    def __init__(self):
        super().__init__()
        self.cap_left = cv2.VideoCapture(0)

    def set_capture_fps(self,cap):
        cap.set(cv2.CAP_PROP_FPS, 30)  # 设置宽度为4K


    def set_capture_format(self,cap):
        cap.set(cv2.CAP_PROP_FOURCC,cv2.VideoWriter_fourcc('M','J','P','G'))

    def set_capture_properties(self, cap):
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)  # 设置宽度为4K
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)  # 设置高度为4K


    async def recv(self):
        left_ret, left_frame = self.cap_left.read()
        double_frame = cv2.hconcat([left_frame, left_frame])
        
        pts, time_base = await self.next_timestamp()
        frame = VideoFrame.from_ndarray(double_frame, format="bgr24")
        frame.pts = pts
        frame.time_base = time_base

        return frame
        
    def __del__(self):
        self.cap_left.release()
    