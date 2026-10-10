{
  "patcher": {
    "fileversion": 1,
    "appversion": {
      "major": 8,
      "minor": 6,
      "revision": 5,
      "architecture": "x64",
      "modernui": 1
    },
    "classnamespace": "box",
    "rect": [
      80,
      100,
      1120,
      1120
    ],
    "openinpresentation": 1,
    "devicewidth": 150,
    "bgcolor": [
      0,
      0,
      0,
      1
    ],
    "boxes": [
      {
        "box": {
          "id": "input",
          "maxclass": "newobj",
          "text": "plugin~",
          "patching_rect": [
            30,
            200,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "output",
          "maxclass": "newobj",
          "text": "plugout~",
          "patching_rect": [
            30,
            260,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "script",
          "maxclass": "newobj",
          "text": "js yfc-meter.js",
          "patching_rect": [
            30,
            840,
            150,
            22
          ]
        }
      },
      {
        "box": {
          "id": "send",
          "maxclass": "newobj",
          "text": "udpsend 127.0.0.1 17941",
          "patching_rect": [
            30,
            880,
            205,
            22
          ]
        }
      },
      {
        "box": {
          "id": "recv",
          "maxclass": "newobj",
          "text": "udpreceive 17942",
          "patching_rect": [
            270,
            820,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "route",
          "maxclass": "newobj",
          "text": "route /yfc/reset",
          "patching_rect": [
            270,
            850,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "reset",
          "maxclass": "message",
          "text": "reset",
          "patching_rect": [
            270,
            880,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "dsp",
          "maxclass": "newobj",
          "text": "dspstate~",
          "patching_rect": [
            230,
            200,
            175,
            22
          ],
          "varname": "dsp"
        }
      },
      {
        "box": {
          "id": "dsp_sr",
          "maxclass": "newobj",
          "text": "prepend samplerate",
          "patching_rect": [
            230,
            240,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "clock",
          "maxclass": "newobj",
          "text": "qmetro 100",
          "patching_rect": [
            450,
            720,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "live",
          "maxclass": "newobj",
          "text": "live.thisdevice",
          "patching_rect": [
            450,
            200,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "trigger",
          "maxclass": "newobj",
          "text": "t b b b b b b b b b b b b b b",
          "patching_rect": [
            450,
            760,
            255,
            22
          ]
        }
      },
      {
        "box": {
          "id": "pack",
          "maxclass": "newobj",
          "text": "pack 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0. 0.",
          "patching_rect": [
            450,
            800,
            490,
            22
          ]
        }
      },
      {
        "box": {
          "id": "frame",
          "maxclass": "newobj",
          "text": "prepend frame",
          "patching_rect": [
            450,
            840,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "shelf0",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            30,
            320,
            175,
            22
          ],
          "varname": "shelf0"
        }
      },
      {
        "box": {
          "id": "hp0",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            30,
            355,
            175,
            22
          ],
          "varname": "hp0"
        }
      },
      {
        "box": {
          "id": "square0",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            30,
            390,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "shelf1",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            240,
            320,
            175,
            22
          ],
          "varname": "shelf1"
        }
      },
      {
        "box": {
          "id": "hp1",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            240,
            355,
            175,
            22
          ],
          "varname": "hp1"
        }
      },
      {
        "box": {
          "id": "square1",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            240,
            390,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "energy",
          "maxclass": "newobj",
          "text": "+~",
          "patching_rect": [
            30,
            425,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "avg_m",
          "maxclass": "newobj",
          "text": "average~ 80000 bipolar",
          "patching_rect": [
            30,
            460,
            205,
            22
          ],
          "varname": "avg_m"
        }
      },
      {
        "box": {
          "id": "snap_m",
          "maxclass": "newobj",
          "text": "snapshot~",
          "patching_rect": [
            30,
            495,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "avg_s",
          "maxclass": "newobj",
          "text": "average~ 600000 bipolar",
          "patching_rect": [
            240,
            460,
            205,
            22
          ],
          "varname": "avg_s"
        }
      },
      {
        "box": {
          "id": "snap_s",
          "maxclass": "newobj",
          "text": "snapshot~",
          "patching_rect": [
            240,
            495,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "peak0",
          "maxclass": "newobj",
          "text": "peakamp~",
          "patching_rect": [
            30,
            550,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "peak1",
          "maxclass": "newobj",
          "text": "peakamp~",
          "patching_rect": [
            240,
            550,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band0_0",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            520,
            200,
            175,
            22
          ],
          "varname": "band0_0"
        }
      },
      {
        "box": {
          "id": "bsq0_0",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            520,
            235,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band0_1",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            520,
            280,
            175,
            22
          ],
          "varname": "band0_1"
        }
      },
      {
        "box": {
          "id": "bsq0_1",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            520,
            315,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "bsum0",
          "maxclass": "newobj",
          "text": "+~",
          "patching_rect": [
            520,
            365,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "avg_band0",
          "maxclass": "newobj",
          "text": "average~ 20000 bipolar",
          "patching_rect": [
            520,
            400,
            205,
            22
          ],
          "varname": "avg_band0"
        }
      },
      {
        "box": {
          "id": "bsnap0",
          "maxclass": "newobj",
          "text": "snapshot~",
          "patching_rect": [
            520,
            440,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band1_0",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            740,
            200,
            175,
            22
          ],
          "varname": "band1_0"
        }
      },
      {
        "box": {
          "id": "bsq1_0",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            740,
            235,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band1_1",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            740,
            280,
            175,
            22
          ],
          "varname": "band1_1"
        }
      },
      {
        "box": {
          "id": "bsq1_1",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            740,
            315,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "bsum1",
          "maxclass": "newobj",
          "text": "+~",
          "patching_rect": [
            740,
            365,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "avg_band1",
          "maxclass": "newobj",
          "text": "average~ 20000 bipolar",
          "patching_rect": [
            740,
            400,
            205,
            22
          ],
          "varname": "avg_band1"
        }
      },
      {
        "box": {
          "id": "bsnap1",
          "maxclass": "newobj",
          "text": "snapshot~",
          "patching_rect": [
            740,
            440,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band2_0",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            960,
            200,
            175,
            22
          ],
          "varname": "band2_0"
        }
      },
      {
        "box": {
          "id": "bsq2_0",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            960,
            235,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band2_1",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            960,
            280,
            175,
            22
          ],
          "varname": "band2_1"
        }
      },
      {
        "box": {
          "id": "bsq2_1",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            960,
            315,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "bsum2",
          "maxclass": "newobj",
          "text": "+~",
          "patching_rect": [
            960,
            365,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "avg_band2",
          "maxclass": "newobj",
          "text": "average~ 20000 bipolar",
          "patching_rect": [
            960,
            400,
            205,
            22
          ],
          "varname": "avg_band2"
        }
      },
      {
        "box": {
          "id": "bsnap2",
          "maxclass": "newobj",
          "text": "snapshot~",
          "patching_rect": [
            960,
            440,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band3_0",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            1180,
            200,
            175,
            22
          ],
          "varname": "band3_0"
        }
      },
      {
        "box": {
          "id": "bsq3_0",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            1180,
            235,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band3_1",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            1180,
            280,
            175,
            22
          ],
          "varname": "band3_1"
        }
      },
      {
        "box": {
          "id": "bsq3_1",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            1180,
            315,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "bsum3",
          "maxclass": "newobj",
          "text": "+~",
          "patching_rect": [
            1180,
            365,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "avg_band3",
          "maxclass": "newobj",
          "text": "average~ 20000 bipolar",
          "patching_rect": [
            1180,
            400,
            205,
            22
          ],
          "varname": "avg_band3"
        }
      },
      {
        "box": {
          "id": "bsnap3",
          "maxclass": "newobj",
          "text": "snapshot~",
          "patching_rect": [
            1180,
            440,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band4_0",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            1400,
            200,
            175,
            22
          ],
          "varname": "band4_0"
        }
      },
      {
        "box": {
          "id": "bsq4_0",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            1400,
            235,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band4_1",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            1400,
            280,
            175,
            22
          ],
          "varname": "band4_1"
        }
      },
      {
        "box": {
          "id": "bsq4_1",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            1400,
            315,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "bsum4",
          "maxclass": "newobj",
          "text": "+~",
          "patching_rect": [
            1400,
            365,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "avg_band4",
          "maxclass": "newobj",
          "text": "average~ 20000 bipolar",
          "patching_rect": [
            1400,
            400,
            205,
            22
          ],
          "varname": "avg_band4"
        }
      },
      {
        "box": {
          "id": "bsnap4",
          "maxclass": "newobj",
          "text": "snapshot~",
          "patching_rect": [
            1400,
            440,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band5_0",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            1620,
            200,
            175,
            22
          ],
          "varname": "band5_0"
        }
      },
      {
        "box": {
          "id": "bsq5_0",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            1620,
            235,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band5_1",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            1620,
            280,
            175,
            22
          ],
          "varname": "band5_1"
        }
      },
      {
        "box": {
          "id": "bsq5_1",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            1620,
            315,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "bsum5",
          "maxclass": "newobj",
          "text": "+~",
          "patching_rect": [
            1620,
            365,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "avg_band5",
          "maxclass": "newobj",
          "text": "average~ 20000 bipolar",
          "patching_rect": [
            1620,
            400,
            205,
            22
          ],
          "varname": "avg_band5"
        }
      },
      {
        "box": {
          "id": "bsnap5",
          "maxclass": "newobj",
          "text": "snapshot~",
          "patching_rect": [
            1620,
            440,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band6_0",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            1840,
            200,
            175,
            22
          ],
          "varname": "band6_0"
        }
      },
      {
        "box": {
          "id": "bsq6_0",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            1840,
            235,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band6_1",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            1840,
            280,
            175,
            22
          ],
          "varname": "band6_1"
        }
      },
      {
        "box": {
          "id": "bsq6_1",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            1840,
            315,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "bsum6",
          "maxclass": "newobj",
          "text": "+~",
          "patching_rect": [
            1840,
            365,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "avg_band6",
          "maxclass": "newobj",
          "text": "average~ 20000 bipolar",
          "patching_rect": [
            1840,
            400,
            205,
            22
          ],
          "varname": "avg_band6"
        }
      },
      {
        "box": {
          "id": "bsnap6",
          "maxclass": "newobj",
          "text": "snapshot~",
          "patching_rect": [
            1840,
            440,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band7_0",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            2060,
            200,
            175,
            22
          ],
          "varname": "band7_0"
        }
      },
      {
        "box": {
          "id": "bsq7_0",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            2060,
            235,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "band7_1",
          "maxclass": "newobj",
          "text": "biquad~ 1 0 0 0 0",
          "patching_rect": [
            2060,
            280,
            175,
            22
          ],
          "varname": "band7_1"
        }
      },
      {
        "box": {
          "id": "bsq7_1",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            2060,
            315,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "bsum7",
          "maxclass": "newobj",
          "text": "+~",
          "patching_rect": [
            2060,
            365,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "avg_band7",
          "maxclass": "newobj",
          "text": "average~ 20000 bipolar",
          "patching_rect": [
            2060,
            400,
            205,
            22
          ],
          "varname": "avg_band7"
        }
      },
      {
        "box": {
          "id": "bsnap7",
          "maxclass": "newobj",
          "text": "snapshot~",
          "patching_rect": [
            2060,
            440,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "ms_mid",
          "maxclass": "newobj",
          "text": "+~",
          "patching_rect": [
            520,
            490,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "ms_norm_mid",
          "maxclass": "newobj",
          "text": "*~ 0.7071067811865476",
          "patching_rect": [
            520,
            525,
            205,
            22
          ]
        }
      },
      {
        "box": {
          "id": "ms_sq_mid",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            520,
            560,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "avg_mid",
          "maxclass": "newobj",
          "text": "average~ 20000 bipolar",
          "patching_rect": [
            520,
            595,
            205,
            22
          ],
          "varname": "avg_mid"
        }
      },
      {
        "box": {
          "id": "snap_mid",
          "maxclass": "newobj",
          "text": "snapshot~",
          "patching_rect": [
            520,
            630,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "ms_side",
          "maxclass": "newobj",
          "text": "-~",
          "patching_rect": [
            740,
            490,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "ms_norm_side",
          "maxclass": "newobj",
          "text": "*~ 0.7071067811865476",
          "patching_rect": [
            740,
            525,
            205,
            22
          ]
        }
      },
      {
        "box": {
          "id": "ms_sq_side",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            740,
            560,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "avg_side",
          "maxclass": "newobj",
          "text": "average~ 20000 bipolar",
          "patching_rect": [
            740,
            595,
            205,
            22
          ],
          "varname": "avg_side"
        }
      },
      {
        "box": {
          "id": "snap_side",
          "maxclass": "newobj",
          "text": "snapshot~",
          "patching_rect": [
            740,
            630,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "scope_buffer",
          "maxclass": "newobj",
          "text": "buffer~ yfc_scope 400 2",
          "patching_rect": [
            990,
            500,
            205,
            22
          ],
          "varname": "scope_buffer"
        }
      },
      {
        "box": {
          "id": "scope_record",
          "maxclass": "newobj",
          "text": "record~ yfc_scope 2 @loop 1",
          "patching_rect": [
            990,
            535,
            215,
            22
          ]
        }
      },
      {
        "box": {
          "id": "scope_clock",
          "maxclass": "newobj",
          "text": "qmetro 25",
          "patching_rect": [
            990,
            575,
            175,
            22
          ],
          "varname": "scope_clock"
        }
      },
      {
        "box": {
          "id": "scope_position",
          "maxclass": "newobj",
          "text": "snapshot~",
          "patching_rect": [
            990,
            610,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "scope_message",
          "maxclass": "newobj",
          "text": "prepend scope",
          "patching_rect": [
            990,
            645,
            175,
            22
          ]
        }
      },
      {
        "box": {
          "id": "status_panel",
          "maxclass": "jsui",
          "filename": "yfc-panel.js",
          "numinlets": 1,
          "numoutlets": 0,
          "patching_rect": [
            30,
            930,
            150,
            169
          ],
          "presentation": 1,
          "presentation_rect": [
            0,
            0,
            150,
            169
          ],
          "border": 0,
          "ignoreclick": 1,
          "annotation": "Wander_scope: sends audio analysis to Stream Deck. Place one instance last on Master/Main."
        }
      },
      {
        "box": {
          "id": "panel_activity",
          "maxclass": "newobj",
          "text": "t b",
          "patching_rect": [
            270,
            930,
            45,
            22
          ]
        }
      }
    ],
    "lines": [
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "output",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "output",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "script",
            0
          ],
          "destination": [
            "send",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "recv",
            0
          ],
          "destination": [
            "route",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "route",
            0
          ],
          "destination": [
            "reset",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "reset",
            0
          ],
          "destination": [
            "script",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "dsp",
            1
          ],
          "destination": [
            "dsp_sr",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "dsp_sr",
            0
          ],
          "destination": [
            "script",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "dsp",
            0
          ],
          "destination": [
            "clock",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "live",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "clock",
            0
          ],
          "destination": [
            "trigger",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "pack",
            0
          ],
          "destination": [
            "frame",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "frame",
            0
          ],
          "destination": [
            "script",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "shelf0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "shelf0",
            0
          ],
          "destination": [
            "hp0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "hp0",
            0
          ],
          "destination": [
            "square0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "hp0",
            0
          ],
          "destination": [
            "square0",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "shelf1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "shelf1",
            0
          ],
          "destination": [
            "hp1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "hp1",
            0
          ],
          "destination": [
            "square1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "hp1",
            0
          ],
          "destination": [
            "square1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "square0",
            0
          ],
          "destination": [
            "energy",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "square1",
            0
          ],
          "destination": [
            "energy",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "energy",
            0
          ],
          "destination": [
            "avg_m",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "avg_m",
            0
          ],
          "destination": [
            "snap_m",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            0
          ],
          "destination": [
            "snap_m",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "snap_m",
            0
          ],
          "destination": [
            "pack",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "energy",
            0
          ],
          "destination": [
            "avg_s",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "avg_s",
            0
          ],
          "destination": [
            "snap_s",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            1
          ],
          "destination": [
            "snap_s",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "snap_s",
            0
          ],
          "destination": [
            "pack",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "peak0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            2
          ],
          "destination": [
            "peak0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "peak0",
            0
          ],
          "destination": [
            "pack",
            2
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "peak1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            3
          ],
          "destination": [
            "peak1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "peak1",
            0
          ],
          "destination": [
            "pack",
            3
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "band0_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band0_0",
            0
          ],
          "destination": [
            "bsq0_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band0_0",
            0
          ],
          "destination": [
            "bsq0_0",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "band0_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band0_1",
            0
          ],
          "destination": [
            "bsq0_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band0_1",
            0
          ],
          "destination": [
            "bsq0_1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq0_0",
            0
          ],
          "destination": [
            "bsum0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq0_1",
            0
          ],
          "destination": [
            "bsum0",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsum0",
            0
          ],
          "destination": [
            "avg_band0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "avg_band0",
            0
          ],
          "destination": [
            "bsnap0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            4
          ],
          "destination": [
            "bsnap0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsnap0",
            0
          ],
          "destination": [
            "pack",
            4
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "band1_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band1_0",
            0
          ],
          "destination": [
            "bsq1_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band1_0",
            0
          ],
          "destination": [
            "bsq1_0",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "band1_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band1_1",
            0
          ],
          "destination": [
            "bsq1_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band1_1",
            0
          ],
          "destination": [
            "bsq1_1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq1_0",
            0
          ],
          "destination": [
            "bsum1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq1_1",
            0
          ],
          "destination": [
            "bsum1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsum1",
            0
          ],
          "destination": [
            "avg_band1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "avg_band1",
            0
          ],
          "destination": [
            "bsnap1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            5
          ],
          "destination": [
            "bsnap1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsnap1",
            0
          ],
          "destination": [
            "pack",
            5
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "band2_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band2_0",
            0
          ],
          "destination": [
            "bsq2_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band2_0",
            0
          ],
          "destination": [
            "bsq2_0",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "band2_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band2_1",
            0
          ],
          "destination": [
            "bsq2_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band2_1",
            0
          ],
          "destination": [
            "bsq2_1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq2_0",
            0
          ],
          "destination": [
            "bsum2",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq2_1",
            0
          ],
          "destination": [
            "bsum2",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsum2",
            0
          ],
          "destination": [
            "avg_band2",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "avg_band2",
            0
          ],
          "destination": [
            "bsnap2",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            6
          ],
          "destination": [
            "bsnap2",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsnap2",
            0
          ],
          "destination": [
            "pack",
            6
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "band3_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band3_0",
            0
          ],
          "destination": [
            "bsq3_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band3_0",
            0
          ],
          "destination": [
            "bsq3_0",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "band3_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band3_1",
            0
          ],
          "destination": [
            "bsq3_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band3_1",
            0
          ],
          "destination": [
            "bsq3_1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq3_0",
            0
          ],
          "destination": [
            "bsum3",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq3_1",
            0
          ],
          "destination": [
            "bsum3",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsum3",
            0
          ],
          "destination": [
            "avg_band3",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "avg_band3",
            0
          ],
          "destination": [
            "bsnap3",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            7
          ],
          "destination": [
            "bsnap3",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsnap3",
            0
          ],
          "destination": [
            "pack",
            7
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "band4_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band4_0",
            0
          ],
          "destination": [
            "bsq4_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band4_0",
            0
          ],
          "destination": [
            "bsq4_0",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "band4_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band4_1",
            0
          ],
          "destination": [
            "bsq4_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band4_1",
            0
          ],
          "destination": [
            "bsq4_1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq4_0",
            0
          ],
          "destination": [
            "bsum4",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq4_1",
            0
          ],
          "destination": [
            "bsum4",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsum4",
            0
          ],
          "destination": [
            "avg_band4",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "avg_band4",
            0
          ],
          "destination": [
            "bsnap4",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            8
          ],
          "destination": [
            "bsnap4",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsnap4",
            0
          ],
          "destination": [
            "pack",
            8
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "band5_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band5_0",
            0
          ],
          "destination": [
            "bsq5_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band5_0",
            0
          ],
          "destination": [
            "bsq5_0",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "band5_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band5_1",
            0
          ],
          "destination": [
            "bsq5_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band5_1",
            0
          ],
          "destination": [
            "bsq5_1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq5_0",
            0
          ],
          "destination": [
            "bsum5",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq5_1",
            0
          ],
          "destination": [
            "bsum5",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsum5",
            0
          ],
          "destination": [
            "avg_band5",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "avg_band5",
            0
          ],
          "destination": [
            "bsnap5",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            9
          ],
          "destination": [
            "bsnap5",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsnap5",
            0
          ],
          "destination": [
            "pack",
            9
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "band6_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band6_0",
            0
          ],
          "destination": [
            "bsq6_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band6_0",
            0
          ],
          "destination": [
            "bsq6_0",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "band6_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band6_1",
            0
          ],
          "destination": [
            "bsq6_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band6_1",
            0
          ],
          "destination": [
            "bsq6_1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq6_0",
            0
          ],
          "destination": [
            "bsum6",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq6_1",
            0
          ],
          "destination": [
            "bsum6",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsum6",
            0
          ],
          "destination": [
            "avg_band6",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "avg_band6",
            0
          ],
          "destination": [
            "bsnap6",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            10
          ],
          "destination": [
            "bsnap6",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsnap6",
            0
          ],
          "destination": [
            "pack",
            10
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "band7_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band7_0",
            0
          ],
          "destination": [
            "bsq7_0",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band7_0",
            0
          ],
          "destination": [
            "bsq7_0",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "band7_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band7_1",
            0
          ],
          "destination": [
            "bsq7_1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "band7_1",
            0
          ],
          "destination": [
            "bsq7_1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq7_0",
            0
          ],
          "destination": [
            "bsum7",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsq7_1",
            0
          ],
          "destination": [
            "bsum7",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsum7",
            0
          ],
          "destination": [
            "avg_band7",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "avg_band7",
            0
          ],
          "destination": [
            "bsnap7",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            11
          ],
          "destination": [
            "bsnap7",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bsnap7",
            0
          ],
          "destination": [
            "pack",
            11
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "ms_mid",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "ms_mid",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "ms_mid",
            0
          ],
          "destination": [
            "ms_norm_mid",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "ms_norm_mid",
            0
          ],
          "destination": [
            "ms_sq_mid",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "ms_norm_mid",
            0
          ],
          "destination": [
            "ms_sq_mid",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "ms_sq_mid",
            0
          ],
          "destination": [
            "avg_mid",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "avg_mid",
            0
          ],
          "destination": [
            "snap_mid",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            12
          ],
          "destination": [
            "snap_mid",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "snap_mid",
            0
          ],
          "destination": [
            "pack",
            12
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "ms_side",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "ms_side",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "ms_side",
            0
          ],
          "destination": [
            "ms_norm_side",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "ms_norm_side",
            0
          ],
          "destination": [
            "ms_sq_side",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "ms_norm_side",
            0
          ],
          "destination": [
            "ms_sq_side",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "ms_sq_side",
            0
          ],
          "destination": [
            "avg_side",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "avg_side",
            0
          ],
          "destination": [
            "snap_side",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "trigger",
            13
          ],
          "destination": [
            "snap_side",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "snap_side",
            0
          ],
          "destination": [
            "pack",
            13
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "scope_record",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "scope_record",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "dsp",
            0
          ],
          "destination": [
            "scope_record",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "dsp",
            0
          ],
          "destination": [
            "scope_clock",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "scope_record",
            0
          ],
          "destination": [
            "scope_position",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "scope_clock",
            0
          ],
          "destination": [
            "scope_position",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "scope_position",
            0
          ],
          "destination": [
            "scope_message",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "scope_message",
            0
          ],
          "destination": [
            "script",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "script",
            0
          ],
          "destination": [
            "panel_activity",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "panel_activity",
            0
          ],
          "destination": [
            "status_panel",
            0
          ]
        }
      }
    ],
    "dependency_cache": [
      {
        "name": "yfc-meter.js",
        "type": "TEXT",
        "implicit": 1
      },
      {
        "name": "yfc-panel.js",
        "type": "TEXT",
        "implicit": 1
      }
    ],
    "autosave": 0
  }
}