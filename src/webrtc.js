import { useState, useEffect, useRef } from 'react';

const useWebRTC = () => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const peerConnectionRef = useRef(null);
    const videoRef = useRef(null);
    const dataChannelRef = useRef(null);
    useEffect(() => {
        const init = () => {
            createPeerConnection();
            peerConnectionRef.current.addTransceiver('video', { direction: 'recvonly' });

            const constraints = {
                audio: false, // Assuming you want audio and video. Set to false if not needed
                video: false
            };

            if (constraints.audio || constraints.video) {
                navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
                    setLocalStream(stream);
                    stream.getTracks().forEach((track) => {
                        peerConnectionRef.current.addTrack(track, stream);
                    });
                    negotiate();
                }, (err) => {
                    alert('Could not acquire media: ' + err);
                });
            } else {
                negotiate();
            }
        };

        init();

        return () => {
            // Cleanup on unmount
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
        };
    }, []);
    const createPeerConnection = () => {
        var config = {
            sdpSemantics: 'unified-plan'
        };
        // config.iceServers = [{ urls: ['stun:stun.l.google.com:19302'] }];
        peerConnectionRef.current = new RTCPeerConnection(config); // Corrected

        // register some listeners to help debugging
        peerConnectionRef.current.addEventListener('icegatheringstatechange', () => {
            // Ensure iceGatheringLog is defined or handled appropriately
            console.log(' -> ' + peerConnectionRef.current.iceGatheringState);
        }, false);

        peerConnectionRef.current.addEventListener('iceconnectionstatechange', () => {
            // Ensure iceConnectionLog is defined or handled appropriately
            console.log(' -> ' + peerConnectionRef.current.iceConnectionState);
        }, false);

        peerConnectionRef.current.addEventListener('signalingstatechange', () => {
            // Ensure signalingLog is defined or handled appropriately
            console.log(' -> ' + peerConnectionRef.current.signalingState);
        }, false);

        // Inside the 'track' event listener
        peerConnectionRef.current.addEventListener('track', (evt) => {
            if (videoRef.current) {
                videoRef.current.srcObject = evt.streams[0];
            }
            console.log(videoRef.current, "videoRef.current")
        });
    }

    const negotiate = () => {
        console.log('Negotiating');

        return peerConnectionRef.current.createOffer().then((offer) => {
            console.log(offer.sdp, "offer.sdp")
            console.log(offer.type, "offer.sdp")
            return peerConnectionRef.current.setLocalDescription(offer);
        }).then(() => {
            console.log(peerConnectionRef.current.iceGatheringState, "peerConnectionRef.current.iceGatheringState")
            // wait for ICE gathering to complete
            return new Promise((resolve) => {
                console.log('Waiting for ICE gathering');
                if (peerConnectionRef.current.iceGatheringState === 'complete') {
                    resolve();
                } else {
                    function checkState() {
                        console.log('Checking state');
                        if (peerConnectionRef.current.iceGatheringState === 'complete') {
                            peerConnectionRef.current.removeEventListener('icegatheringstatechange', checkState);
                            resolve();
                        }
                    }
                    peerConnectionRef.current.addEventListener('icegatheringstatechange', checkState);
                }
            });
        }).then(() => {
            var offer = peerConnectionRef.current.localDescription;


            return fetch('/offer', {
                body: JSON.stringify({
                    sdp: offer.sdp,
                    type: offer.type
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            });
        }).then((response) => {
            return response.json();
        }).then((answer) => {

            return peerConnectionRef.current.setRemoteDescription(answer);
        }).catch((e) => {
            alert(e);
        });
    }

    return { video: videoRef };
}
export default useWebRTC;
