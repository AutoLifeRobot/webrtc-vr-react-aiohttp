import argparse
import asyncio
import json
import logging
import os
import ssl
import uuid

import cv2
from video import ImageVideoStreamTrack
from aiohttp import web
from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaBlackhole, MediaPlayer, MediaRecorder, MediaRelay
from av import VideoFrame
from video import ImageVideoStreamTrack


ROOT = os.path.dirname(__file__)

logger = logging.getLogger("pc")


async def error_middleware(app, handler):
    async def middleware_handler(request):
        try:
            response = await handler(request)
            if response.status == 403:
                raise web.HTTPFound('/index.html')
            return response
        except web.HTTPException as ex:
            if ex.status == 403:
                return web.HTTPFound('/index.html')
            raise
    return middleware_handler

async def handle_offer(request):
    data = await request.json()
    offer = RTCSessionDescription(sdp=data["sdp"], type=data["type"])
    pc = RTCPeerConnection()

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        print(f"Connection state is {pc.connectionState}")
        if pc.connectionState == "failed":
            await pc.close()

    pc.addTrack(ImageVideoStreamTrack())

    @pc.on("datachannel")
    def on_datachannel(channel):
        @channel.on("message")
        async def on_message(message):
            print("Message received", message)
            # robot_control.process(message)
            pass

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    
    return web.Response(
        content_type="application/json",
        text=json.dumps(
            {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
        ),
    )



if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="WebRTC audio / video / data-channels demo"
    )
    parser.add_argument("--cert-file", help="SSL certificate file (for HTTPS)")
    parser.add_argument("--key-file", help="SSL key file (for HTTPS)")
    parser.add_argument(
        "--host", default="0.0.0.0", help="Host for HTTP server (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port", type=int, default=8080, help="Port for HTTP server (default: 8080)"
    )
    parser.add_argument("--record-to", help="Write received media to a file.")
    parser.add_argument("--verbose", "-v", action="count")
    args = parser.parse_args()

    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)

    if args.cert_file:
        ssl_context = ssl.SSLContext()
        ssl_context.load_cert_chain(args.cert_file, args.key_file)
    else:
        ssl_context = None

    app = web.Application(middlewares=[error_middleware])
    app.router.add_static('/',
                      path='dist',
                      name='dist')

    app.router.add_post("/offer", handle_offer)


    web.run_app(
        app, access_log=None, host=args.host, port=args.port, ssl_context=ssl_context
    )
