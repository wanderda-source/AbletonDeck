"""A local, dependency-free Ableton Live 11/12 control surface.

All Live API calls run on Live's timer thread. No audio passes through this script.
"""
import json
import logging
import socket
from ableton.v2.control_surface import ControlSurface

logger = logging.getLogger(__name__)
COMMAND_PORT = 17940
STATE_PORT = 17941


class AbletonDeck(ControlSurface):
    def __init__(self, c_instance):
        super(AbletonDeck, self).__init__(c_instance)
        self._udp = None
        self._tick = 0
        try:
            self._udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self._udp.bind(('127.0.0.1', COMMAND_PORT))
            self._udp.setblocking(False)
            self.show_message('AbletonDeck: connected locally')
        except Exception as error:
            if self._udp:
                self._udp.close()
            self._udp = None
            logger.warning('AbletonDeck startup: %s', error)

    def update_display(self):
        super(AbletonDeck, self).update_display()
        self._poll()

    def _poll(self):
        if not self._udp:
            return
        for _ in range(16):
            try:
                data, peer = self._udp.recvfrom(4096)
            except (BlockingIOError, socket.error):
                break
            if peer[0] != '127.0.0.1':
                continue
            try:
                msg = json.loads(data.decode('utf-8'))
                if msg.get('v') == 1:
                    self._command(msg.get('command'))
            except Exception as error:
                logger.warning('AbletonDeck command: %s', error)
        self._tick += 1
        if self._tick % 2 == 0:
            try:
                self._udp.sendto(json.dumps(self._state(), ensure_ascii=False).encode('utf-8'), ('127.0.0.1', STATE_PORT))
            except Exception as error:
                if self._tick % 100 == 0:
                    logger.warning('AbletonDeck state: %s', error)

    def _state(self):
        song = self.song
        track = song.view.selected_track
        can_arm = bool(getattr(track, 'can_be_armed', False))
        return {
            'v': 1, 'type': 'state', 'playing': bool(song.is_playing),
            'record': bool(song.record_mode), 'session_record': bool(song.session_record),
            'loop': bool(song.loop), 'metronome': bool(song.metronome),
            'overdub': bool(song.overdub), 'tempo': song.tempo,
            'song_time': float(getattr(song, 'current_song_time', 0.0)),
            'scene': song.view.selected_scene.name,
            'track': {'name': track.name, 'mute': bool(getattr(track, 'mute', False)), 'solo': bool(getattr(track, 'solo', False)),
                      'can_arm': can_arm, 'arm': bool(track.arm) if can_arm else False}
        }

    def _command(self, name):
        song = self.song
        track = song.view.selected_track
        if name == 'play':
            if song.is_playing:
                song.stop_playing()
            else:
                song.continue_playing()
        elif name == 'stop':
            song.stop_playing()
        elif name == 'record':
            song.record_mode = not song.record_mode
        elif name == 'sessionrecord':
            song.session_record = not song.session_record
        elif name in ('loop', 'overdub'):
            setattr(song, name, not getattr(song, name))
        elif name == 'click':
            song.metronome = not song.metronome
        elif name in ('mute', 'solo'):
            if track != song.master_track:
                setattr(track, name, not getattr(track, name))
        elif name == 'arm':
            if track.can_be_armed:
                track.arm = not track.arm
        elif name in ('prev', 'next'):
            tracks = list(song.visible_tracks) + list(song.return_tracks) + [song.master_track]
            if track in tracks:
                index = tracks.index(track) + (-1 if name == 'prev' else 1)
                song.view.selected_track = tracks[max(0, min(len(tracks) - 1, index))]
        elif name == 'scene':
            song.view.selected_scene.fire()
        elif name == 'stopclips':
            song.stop_all_clips()
        elif name == 'tap':
            song.tap_tempo()
        elif name == 'undo' and song.can_undo:
            song.undo()
        elif name == 'redo' and song.can_redo:
            song.redo()

    def disconnect(self):
        if self._udp:
            self._udp.close()
            self._udp = None
        super(AbletonDeck, self).disconnect()
