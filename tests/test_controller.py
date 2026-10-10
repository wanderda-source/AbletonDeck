import importlib.util
import json
import socket
import sys
import types
import unittest
from pathlib import Path


class Base:
    def __init__(self, instance):
        self.song = instance
        self.messages = []

    def show_message(self, text):
        self.messages.append(text)

    def log_message(self, text):
        self.messages.append(text)

    def update_display(self):
        pass

    def disconnect(self):
        pass


sys.modules['ableton'] = types.ModuleType('ableton')
sys.modules['ableton.v2'] = types.ModuleType('ableton.v2')
sys.modules['ableton.v2.control_surface'] = types.SimpleNamespace(ControlSurface=Base)
spec = importlib.util.spec_from_file_location('controller', Path(__file__).parents[1] / 'AbletonDeck/controller.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def track(name, can_arm=True):
    return types.SimpleNamespace(name=name, mute=False, solo=False, can_be_armed=can_arm, arm=False)


class Song:
    def __init__(self):
        self.visible_tracks = [track('One'), track('Two')]
        self.return_tracks = [track('Return', False)]
        self.master_track = track('Main', False)
        self.view = types.SimpleNamespace(selected_track=self.visible_tracks[0],
                                          selected_scene=types.SimpleNamespace(name='Scene 1', fire=lambda:None))
        self.is_playing = self.record_mode = self.session_record = self.loop = self.metronome = self.overdub = False
        self.tempo = 120.0
        self.can_undo = self.can_redo = True

    def continue_playing(self):
        self.is_playing = True

    def stop_playing(self):
        self.is_playing = False


class ControllerTest(unittest.TestCase):
    def test_main_track_without_mute_solo_keeps_transport_state(self):
        song = Song()
        song.current_song_time = 17.25
        song.master_track = types.SimpleNamespace(name='Main', can_be_armed=False)
        song.view.selected_track = song.master_track
        controller = object.__new__(module.AbletonDeck)
        controller.song = song
        state = controller._state()
        self.assertEqual(state['track']['name'], 'Main')
        self.assertFalse(state['track']['mute'])
        self.assertFalse(state['track']['solo'])
        self.assertFalse(state['track']['arm'])
        self.assertEqual(state['tempo'], 120)
        self.assertEqual(state['song_time'], 17.25)

    def test_local_udp_commands_and_feedback(self):
        receiver = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        receiver.bind(('127.0.0.1', 17941))
        receiver.settimeout(1)
        sender = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        song = Song()
        controller = module.AbletonDeck(song)
        try:
            self.assertIsNotNone(controller._udp)
            for name in ['play', 'mute', 'next', 'arm', 'click']:
                sender.sendto(json.dumps({'v': 1, 'command': name}).encode(), ('127.0.0.1', 17940))
            controller.update_display()
            controller.update_display()
            state = json.loads(receiver.recv(4096))
            self.assertTrue(state['playing'])
            self.assertTrue(song.visible_tracks[0].mute)
            self.assertEqual(state['track']['name'], 'Two')
            self.assertTrue(state['track']['arm'])
            self.assertTrue(state['metronome'])
            controller._command('next')
            controller._command('next')
            controller._command('mute')
            controller._command('arm')
            self.assertFalse(song.master_track.mute)
            self.assertFalse(song.master_track.arm)
        finally:
            controller.disconnect()
            receiver.close()
            sender.close()

    def test_malformed_input_does_not_stop_feedback(self):
        sender = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        controller = module.AbletonDeck(Song())
        try:
            sender.sendto(b'garbage', ('127.0.0.1',17940))
            sender.sendto(b'{"v":1,"command":"play"}', ('127.0.0.1',17940))
            with self.assertLogs('controller', level='WARNING') as logs:
                controller.update_display()
            self.assertTrue(controller.song.is_playing)
            self.assertTrue(any('command' in m for m in logs.output))
        finally:
            sender.close()
            controller.disconnect()


if __name__ == '__main__':
    unittest.main()
