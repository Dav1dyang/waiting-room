// The stranger, over WebRTC. Perfect negotiation, with role "answer" as the polite peer.
// The mic is captured here and only here, on a match, never while queued (D-57, D-79).
// Every signal frame carries the room id both ways, so a late frame from an old room is dropped.

/** Audio constraints: the room is two people in two small rooms, so clean up the near end. */
const AUDIO = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } };
const VIDEO = { video: { width: 320, height: 240, frameRate: 15 } };

export class Peer {
  /**
   * @param {object} o
   * @param {'offer'|'answer'} o.role     which side we are; "answer" is polite
   * @param {string} o.room               the room id from the match message
   * @param {object[]} o.iceServers
   * @param {(msg: object) => void} o.send      put one frame on the lobby socket
   * @param {(kind: string) => void} o.onTrack  'audio' or 'video' arrived from the stranger
   * @param {(kind: string) => void} o.onTrackGone
   * @param {() => void} o.onState              connectionState changed
   */
  constructor({ role, room, iceServers, send, onTrack, onTrackGone, onState }) {
    this.role = role;
    this.polite = role === 'answer';
    this.room = room;
    this.send = send;
    this.onTrack = onTrack || (() => {});
    this.onTrackGone = onTrackGone || (() => {});
    this.onState = onState || (() => {});

    this.pc = new RTCPeerConnection({ iceServers: iceServers || [] });
    this.makingOffer = false;
    this.ignoreOffer = false;
    this.closed = false;
    this.queue = Promise.resolve();

    this.localAudio = null;
    this.localVideo = null;
    this.audioSender = null;
    this.videoSender = null;

    this.remoteAudio = new MediaStream();
    this.remoteVideo = new MediaStream();

    this.pc.onnegotiationneeded = async () => {
      if (this.closed) return;
      try {
        this.makingOffer = true;
        await this.pc.setLocalDescription();
        this.post({ description: this.pc.localDescription });
      } catch {
        // a parallel rollback took it; the other side will drive
      } finally {
        this.makingOffer = false;
      }
    };

    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) this.post({ candidate });
    };

    this.pc.onconnectionstatechange = () => this.onState(this.pc.connectionState);

    this.pc.ontrack = (ev) => {
      const track = ev.track;
      const bag = track.kind === 'audio' ? this.remoteAudio : this.remoteVideo;
      bag.addTrack(track);
      this.onTrack(track.kind, bag);
      const gone = () => {
        try {
          bag.removeTrack(track);
        } catch {
          // already removed
        }
        this.onTrackGone(track.kind, bag);
      };
      track.addEventListener('ended', gone);
      // Only video listens for `mute`. Chrome mutes a remote track on direction changes, and
      // pulling the audio track out of its stream on a transient mute would silence the
      // stranger for the rest of the room with no way back.
      if (track.kind === 'video') track.addEventListener('mute', gone);
    };

    // The mic is captured now. Everything that touches the connection waits on this,
    // so the first answer already carries our track and one negotiation round is enough.
    this.ready = this.startAudio();
  }

  post(data) {
    this.send({ type: 'signal', room: this.room, data });
  }

  async startAudio() {
    try {
      this.localAudio = await navigator.mediaDevices.getUserMedia(AUDIO);
    } catch (err) {
      this.micError = String((err && err.name) || err);
      return null;
    }
    if (this.closed) {
      stopStream(this.localAudio);
      this.localAudio = null;
      return null;
    }
    const track = this.localAudio.getAudioTracks()[0];
    if (track) this.audioSender = this.pc.addTrack(track, this.localAudio);
    return this.localAudio;
  }

  /** Frames arrive in order on one socket, so handle them in order, behind the mic. */
  handleSignal(data) {
    this.queue = this.queue.then(() => this.apply(data)).catch(() => {});
    return this.queue;
  }

  async apply(data) {
    if (this.closed || !data) return;
    await this.ready;
    if (this.closed) return;
    const { description, candidate } = data;
    if (description) {
      const collision =
        description.type === 'offer' && (this.makingOffer || this.pc.signalingState !== 'stable');
      this.ignoreOffer = !this.polite && collision;
      if (this.ignoreOffer) return;
      await this.pc.setRemoteDescription(description); // implicit rollback when polite
      if (description.type === 'offer') {
        await this.pc.setLocalDescription();
        this.post({ description: this.pc.localDescription });
      }
    } else if (candidate) {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (err) {
        if (!this.ignoreOffer) throw err;
      }
    }
  }

  /**
   * Levels without Web Audio, for when the AudioContext will not start in a window that
   * never had a gesture. RTP carries an audio level per packet, so getStats has the number.
   * Coarser than the analyser and slower to poll, but it keeps the meters and the speech
   * gate honest instead of reporting a silent room that is not silent.
   */
  async statsLevels() {
    if (this.closed) return { you: 0, them: 0 };
    let report;
    try {
      report = await this.pc.getStats();
    } catch {
      return { you: 0, them: 0 };
    }
    let you = 0;
    let them = 0;
    report.forEach((s) => {
      if (typeof s.audioLevel !== 'number') return;
      if (s.type === 'media-source' && s.kind === 'audio') you = Math.max(you, s.audioLevel);
      else if (s.type === 'inbound-rtp' && s.kind === 'audio') them = Math.max(them, s.audioLevel);
    });
    return { you, them };
  }

  micIsLive() {
    const t = this.localAudio && this.localAudio.getAudioTracks()[0];
    return !!(t && t.readyState === 'live' && t.enabled);
  }

  /** Show video: capture, add the track, let negotiation happen by itself. */
  async addVideo() {
    if (this.videoSender || this.closed) return this.localVideo;
    this.localVideo = await navigator.mediaDevices.getUserMedia(VIDEO);
    if (this.closed) {
      stopStream(this.localVideo);
      this.localVideo = null;
      return null;
    }
    const track = this.localVideo.getVideoTracks()[0];
    this.videoSender = this.pc.addTrack(track, this.localAudio || this.localVideo);
    return this.localVideo;
  }

  /** Hide video: drop the track, which renegotiates the same way. */
  removeVideo() {
    if (this.videoSender) {
      try {
        this.pc.removeTrack(this.videoSender);
      } catch {
        // connection already going away
      }
      this.videoSender = null;
    }
    stopStream(this.localVideo);
    this.localVideo = null;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    stopStream(this.localAudio);
    stopStream(this.localVideo);
    this.localAudio = null;
    this.localVideo = null;
    this.audioSender = null;
    this.videoSender = null;
    try {
      this.pc.onnegotiationneeded = null;
      this.pc.onicecandidate = null;
      this.pc.ontrack = null;
      this.pc.onconnectionstatechange = null;
      this.pc.close();
    } catch {
      // already closed
    }
  }
}

export function stopStream(stream) {
  if (!stream) return;
  for (const t of stream.getTracks()) {
    try {
      t.stop();
    } catch {
      // already stopped
    }
  }
}
