# Third party acknowledgements

- `ws` 8.22.0, WebSocket implementation: https://github.com/websockets/ws (MIT). Its license is included in the bundled dependency folder.
- K-weighting design constants and equations were checked against `libebur128`: https://github.com/jiixyj/libebur128/blob/master/ebur128/ebur128.c . The library itself is not bundled. Its MIT notice is included in `licenses/libebur128.txt`.
- Max AMPF header layout was checked against public descriptions and `lib/amxd.py` in https://github.com/kzhub/max4live-generators . No repository code is bundled.
- Stream Deck protocol documentation: https://docs.elgato.com/streamdeck/sdk/references/websocket/plugin/ . Elgato SDK implementation is not bundled; the plugin uses the documented protocol directly.
- Live API is supplied by the user's installed Ableton Live. No Ableton application files are redistributed.

This project contains no copied code from ClipDeck or Ableton Rack Control.

- Space Grotesk, copyright 2020 The Space Grotesk Project Authors, SIL OFL 1.1. Numeric glyph outlines are bundled in font-glyphs.json; license in licenses/SpaceGrotesk-OFL.txt. Source: https://github.com/google/fonts/tree/main/ofl/spacegrotesk


Pitch: original implementation inspired by de Cheveigné & Kawahara, YIN (2002), https://doi.org/10.1121/1.1458024. No third-party pitch implementation was copied.
