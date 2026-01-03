import React, { useMemo } from 'react';

// 1. 定义完整的类型（包含新增的segments:3）
interface VectorShape {
  type: 'shape';
  background?: string;
  gradientPack?: (string | number)[];
  pixelPerfect: boolean;
  points: number[];
  segments: number[];
}

interface VectorJson {
  modified: string;
  width: number;
  height: number;
  comps: VectorShape[];
}

// 2. 新的矢量图JSON数据
const vectorData: VectorJson = {
  "modified": "Fri May 07 2021 11:01:53 GMT+0800 (GMT+08:00)",
  "width": 21,
  "height": 38,
  "comps": [
    {
      "type": "shape",
      "gradientPack": [
        "L",
        -100.55,
        911.12,
        -100.96,
        911.12,
        15.42169,
        0,
        0,
        -8.6684,
        1564.37324,
        7920.45753,
        0,
        "#e1e5ff",
        0.29,
        "#f2f6ff",
        0.52,
        "#fafdff",
        0.66,
        "#f5f8ff",
        0.84,
        "#e6eaff",
        1,
        "#d3d7ff"
      ],
      "pixelPerfect": true,
      "points": [
        7.35741,
        20.72368,
        13.70752,
        20.72368,
        13.70752,
        24.29183,
        7.35741,
        24.29183
      ],
      "segments": [
        1,
        2,
        2,
        2,
        5
      ]
    },
    {
      "type": "shape",
      "gradientPack": [
        "L",
        -78.57,
        966.72,
        -78.3,
        966.41,
        51.20403,
        0,
        0,
        -50.59926,
        4027.01503,
        48918.93114,
        0,
        "#8aeff8",
        1,
        "#469bff"
      ],
      "pixelPerfect": true,
      "points": [
        -0.01073,
        11.22876,
        -0.05967,
        6.96247,
        2.48568,
        3.06897,
        6.41324,
        1.40231,
        10.34081,
        -0.26435,
        14.90953,
        0.6103,
        17.9438,
        3.60976,
        20.97807,
        6.60922,
        21.90538,
        11.16753,
        20.28414,
        15.11408,
        18.66291,
        19.0606,
        14.79903,
        21.65071,
        10.53247,
        21.651,
        7.75333,
        21.66708,
        5.07879,
        20.5773,
        3.1023,
        18.62349,
        1.12582,
        16.66969,
        0.00526,
        14.0079,
        -0.01073,
        11.22876
      ],
      "segments": [
        1,
        4,
        4,
        4,
        4,
        4,
        4,
        5
      ]
    },
    {
      "type": "shape",
      "gradientPack": [
        "L",
        -146.17,
        974.31,
        -146.58,
        974.31,
        6.35011,
        0,
        0,
        -126.59894,
        940.01668,
        123378.74567,
        0,
        "#e1e5ff",
        0.29,
        "#f2f6ff",
        0.52,
        "#fafdff",
        0.66,
        "#f5f8ff",
        0.84,
        "#e6eaff",
        1,
        "#d3d7ff"
      ],
      "pixelPerfect": true,
      "points": [
        9.21205,
        26.52948,
        11.82265,
        26.52948,
        11.82265,
        37.99999,
        9.21205,
        37.99999
      ],
      "segments": [
        1,
        2,
        2,
        2,
        5
      ]
    },
    {
      "type": "shape",
      "gradientPack": [
        "L",
        417.08,
        744.33,
        417.08,
        746.7,
        1.00795,
        0,
        0,
        1.00795,
        -409.87481,
        -720.76715,
        0,
        "#e1e5ff",
        0.29,
        "#f2f6ff",
        0.52,
        "#fafdff",
        0.66,
        "#f5f8ff",
        0.84,
        "#e6eaff",
        1,
        "#d3d7ff"
      ],
      "pixelPerfect": true,
      "points": [
        1.9951,
        29.39208,
        19.04967,
        29.39208,
        19.30518,
        29.38652,
        19.55217,
        29.4857,
        19.73289,
        29.66641,
        19.91361,
        29.84714,
        20.01278,
        30.09412,
        20.00723,
        30.34963,
        20.00723,
        30.89393,
        20.01278,
        31.14944,
        19.91361,
        31.39643,
        19.73289,
        31.57715,
        19.55217,
        31.75786,
        19.30518,
        31.85705,
        19.04967,
        31.85148,
        1.9951,
        31.85148,
        1.73959,
        31.85705,
        1.4926,
        31.75786,
        1.31188,
        31.57715,
        1.13116,
        31.39643,
        1.03199,
        31.14944,
        1.03754,
        30.89393,
        1.03754,
        30.34963,
        1.03199,
        30.09412,
        1.13116,
        29.84714,
        1.31188,
        29.66641,
        1.4926,
        29.4857,
        1.73959,
        29.38652,
        1.9951,
        29.39208
      ],
      "segments": [
        1,
        2,
        4,
        4,
        2,
        4,
        4,
        2,
        4,
        4,
        2,
        4,
        4,
        5
      ]
    },
    {
      "type": "shape",
      "gradientPack": [
        "L",
        -90.63,
        881.04,
        -91.04,
        881.04,
        22.37657,
        0,
        0,
        -5.94692,
        2043.03014,
        5264.95394,
        0,
        "#e1e5ff",
        0.29,
        "#f2f6ff",
        0.52,
        "#fafdff",
        0.66,
        "#f5f8ff",
        0.84,
        "#e6eaff",
        1,
        "#d3d7ff"
      ],
      "pixelPerfect": true,
      "points": [
        6.88367,
        24.2616,
        14.15102,
        24.2616,
        14.68544,
        24.26092,
        15.13225,
        24.6854,
        15.15897,
        25.21915,
        15.15897,
        25.76344,
        15.13225,
        26.2972,
        14.68544,
        26.72166,
        14.15102,
        26.721,
        6.88367,
        26.721,
        6.62816,
        26.72656,
        6.38117,
        26.62738,
        6.20045,
        26.44666,
        6.01974,
        26.26595,
        5.92056,
        26.01895,
        5.92612,
        25.76344,
        5.92612,
        25.21915,
        5.92056,
        24.96364,
        6.01974,
        24.71665,
        6.20045,
        24.53593,
        6.38117,
        24.35521,
        6.62816,
        24.25603,
        6.88367,
        24.2616
      ],
      "segments": [
        1,
        2,
        4,
        2,
        4,
        2,
        4,
        4,
        2,
        4,
        4,
        5
      ]
    },
    {
      "type": "shape",
      "gradientPack": [
        "L",
        -81.99,
        961.94,
        -82.43,
        961.94,
        36.7903,
        0,
        0,
        -36.38712,
        3034.99739,
        35013.50865,
        0,
        "#8aeff8",
        1,
        "#469bff"
      ],
      "pixelPerfect": true,
      "points": [
        2.52932,
        11.24891,
        2.48459,
        8.01434,
        4.40522,
        5.05705,
        7.37845,
        3.7825,
        10.35167,
        2.50795,
        13.81784,
        3.15602,
        16.12969,
        5.41875,
        18.44153,
        7.68148,
        19.1639,
        11.13291,
        17.9535,
        14.13282,
        16.74309,
        17.13273,
        13.82774,
        19.11643,
        10.59294,
        19.14119,
        8.47744,
        19.16537,
        6.43695,
        18.34654,
        4.92499,
        16.86671,
        3.41303,
        15.38688,
        2.55057,
        13.36444,
        2.52932,
        11.24891
      ],
      "segments": [
        1,
        4,
        4,
        4,
        4,
        4,
        4,
        5
      ]
    },
    {
      "type": "shape",
      "background": "#ffffff",
      "pixelPerfect": true,
      "points": [
        3.38608,
        11.22876,
        3.35345,
        8.34116,
        5.07663,
        5.70617,
        7.7351,
        4.57846,
        10.39358,
        3.45075,
        13.48578,
        4.04307,
        15.53931,
        6.07339,
        17.59284,
        8.10373,
        18.22027,
        11.189,
        17.12284,
        13.86012,
        16.02541,
        16.53123,
        13.41016,
        18.28425,
        10.52239,
        18.28443,
        8.63792,
        18.30596,
        6.82122,
        17.57162,
        5.48106,
        16.2466,
        4.1409,
        14.92159,
        3.38595,
        13.11335,
        3.38608,
        11.22876
      ],
      "segments": [
        1,
        4,
        4,
        4,
        4,
        4,
        4,
        5
      ]
    },
    {
      "type": "shape",
      "background": "#518bbf",
      "pixelPerfect": true,
      "points": [
        4.39403,
        9.13222,
        16.7213,
        9.13222,
        16.7213,
        12.36774,
        4.39403,
        12.36774
      ],
      "segments": [
        1,
        2,
        2,
        2,
        5
      ]
    },
    {
      "type": "shape",
      "background": "#182056",
      "pixelPerfect": true,
      "points": [
        4.69641,
        9.57572,
        16.35844,
        9.57572,
        16.35844,
        11.94441,
        4.69641,
        11.94441
      ],
      "segments": [
        1,
        2,
        2,
        2,
        5
      ]
    },
    {
      "type": "shape",
      "gradientPack": [
        "L",
        -551.92,
        388.43,
        -551.1,
        386.78,
        1.00795,
        0,
        0,
        -1.00795,
        562.69941,
        405.76187,
        0,
        "#9f5153",
        1,
        "#7b030d"
      ],
      "pixelPerfect": true,
      "points": [
        5.99667,
        14.98842,
        5.99923,
        14.78442,
        6.08427,
        14.5899,
        6.23228,
        14.44947,
        6.38029,
        14.30905,
        6.57902,
        14.23436,
        6.78288,
        14.24254,
        6.98062,
        14.24254,
        7.17047,
        14.32117,
        7.3103,
        14.461,
        7.45013,
        14.60083,
        7.52876,
        14.79068,
        7.52876,
        14.98842,
        7.53694,
        15.19229,
        7.46225,
        15.39101,
        7.32183,
        15.53902,
        7.18141,
        15.68703,
        6.98688,
        15.77208,
        6.78288,
        15.77462,
        6.57279,
        15.78024,
        6.36938,
        15.69914,
        6.22077,
        15.55054,
        6.07216,
        15.40192,
        5.99107,
        15.19851,
        5.99667,
        14.98842
      ],
      "segments": [
        1,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        5
      ]
    },
    {
      "type": "shape",
      "borderWidth": 0.28376,
      "borderColor": "#e4e9f7",
      "pixelPerfect": true,
      "points": [
        5.99667,
        14.98842,
        5.99923,
        14.78442,
        6.08427,
        14.5899,
        6.23228,
        14.44947,
        6.38029,
        14.30905,
        6.57902,
        14.23436,
        6.78288,
        14.24254,
        6.98062,
        14.24254,
        7.17047,
        14.32117,
        7.3103,
        14.461,
        7.45013,
        14.60083,
        7.52876,
        14.79068,
        7.52876,
        14.98842,
        7.53694,
        15.19229,
        7.46225,
        15.39101,
        7.32183,
        15.53902,
        7.18141,
        15.68703,
        6.98688,
        15.77208,
        6.78288,
        15.77462,
        6.57279,
        15.78024,
        6.36938,
        15.69914,
        6.22077,
        15.55054,
        6.07216,
        15.40192,
        5.99107,
        15.19851,
        5.99667,
        14.98842
      ],
      "segments": [
        1,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        5
      ]
    },
    {
      "type": "shape",
      "gradientPack": [
        "L",
        -549.49,
        388.43,
        -548.66,
        386.78,
        1.00795,
        0,
        0,
        -1.00795,
        562.69941,
        405.76187,
        0,
        "#fecf45",
        1,
        "#ffdc84"
      ],
      "pixelPerfect": true,
      "points": [
        8.42584,
        14.98842,
        8.4284,
        14.78442,
        8.51344,
        14.5899,
        8.66145,
        14.44947,
        8.80946,
        14.30905,
        9.00819,
        14.23436,
        9.21205,
        14.24254,
        9.40979,
        14.24254,
        9.59964,
        14.32117,
        9.73947,
        14.461,
        9.87929,
        14.60083,
        9.95793,
        14.79068,
        9.95793,
        14.98842,
        9.96611,
        15.19229,
        9.89142,
        15.39101,
        9.751,
        15.53902,
        9.61058,
        15.68703,
        9.41605,
        15.77208,
        9.21205,
        15.77462,
        9.00196,
        15.78024,
        8.79855,
        15.69914,
        8.64994,
        15.55054,
        8.50133,
        15.40192,
        8.42024,
        15.19851,
        8.42584,
        14.98842
      ],
      "segments": [
        1,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        5
      ]
    },
    {
      "type": "shape",
      "borderWidth": 0.28376,
      "borderColor": "#e4e9f7",
      "pixelPerfect": true,
      "points": [
        8.42584,
        14.98842,
        8.4284,
        14.78442,
        8.51344,
        14.5899,
        8.66145,
        14.44947,
        8.80946,
        14.30905,
        9.00819,
        14.23436,
        9.21205,
        14.24254,
        9.40979,
        14.24254,
        9.59964,
        14.32117,
        9.73947,
        14.461,
        9.87929,
        14.60083,
        9.95793,
        14.79068,
        9.95793,
        14.98842,
        9.96611,
        15.19229,
        9.89142,
        15.39101,
        9.751,
        15.53902,
        9.61058,
        15.68703,
        9.41605,
        15.77208,
        9.21205,
        15.77462,
        9.00196,
        15.78024,
        8.79855,
        15.69914,
        8.64994,
        15.55054,
        8.50133,
        15.40192,
        8.42024,
        15.19851,
        8.42584,
        14.98842
      ],
      "segments": [
        1,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        5
      ]
    },
    {
      "type": "shape",
      "gradientPack": [
        "L",
        -547.05,
        388.43,
        -546.23,
        386.78,
        1.00795,
        0,
        0,
        -1.00795,
        562.69941,
        405.76187,
        0,
        "#73e194",
        1,
        "#acf76d"
      ],
      "pixelPerfect": true,
      "points": [
        10.90541,
        14.98842,
        10.90796,
        14.78442,
        10.993,
        14.5899,
        11.14101,
        14.44947,
        11.28902,
        14.30905,
        11.48775,
        14.23436,
        11.69161,
        14.24254,
        11.88936,
        14.24254,
        12.07921,
        14.32117,
        12.21903,
        14.461,
        12.35886,
        14.60083,
        12.4375,
        14.79068,
        12.4375,
        14.98842,
        12.44567,
        15.19229,
        12.37099,
        15.39101,
        12.23056,
        15.53902,
        12.09014,
        15.68703,
        11.89562,
        15.77208,
        11.69161,
        15.77462,
        11.48152,
        15.78024,
        11.27811,
        15.69914,
        11.1295,
        15.55054,
        10.98089,
        15.40192,
        10.8998,
        15.19851,
        10.90541,
        14.98842
      ],
      "segments": [
        1,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        5
      ]
    },
    {
      "type": "shape",
      "borderWidth": 0.28376,
      "borderColor": "#e4e9f7",
      "pixelPerfect": true,
      "points": [
        10.90541,
        14.98842,
        10.90796,
        14.78442,
        10.993,
        14.5899,
        11.14101,
        14.44947,
        11.28902,
        14.30905,
        11.48775,
        14.23436,
        11.69161,
        14.24254,
        11.88936,
        14.24254,
        12.07921,
        14.32117,
        12.21903,
        14.461,
        12.35886,
        14.60083,
        12.4375,
        14.79068,
        12.4375,
        14.98842,
        12.44567,
        15.19229,
        12.37099,
        15.39101,
        12.23056,
        15.53902,
        12.09014,
        15.68703,
        11.89562,
        15.77208,
        11.69161,
        15.77462,
        11.48152,
        15.78024,
        11.27811,
        15.69914,
        11.1295,
        15.55054,
        10.98089,
        15.40192,
        10.8998,
        15.19851,
        10.90541,
        14.98842
      ],
      "segments": [
        1,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        5
      ]
    },
    {
      "type": "shape",
      "gradientPack": [
        "L",
        -544.62,
        388.43,
        -543.8,
        386.78,
        1.00795,
        0,
        0,
        -1.00795,
        562.69941,
        405.76187,
        0,
        "#2aa9ff",
        1,
        "#005eff"
      ],
      "pixelPerfect": true,
      "points": [
        13.35473,
        14.98842,
        13.35729,
        14.78442,
        13.44233,
        14.5899,
        13.59034,
        14.44947,
        13.73835,
        14.30905,
        13.93708,
        14.23436,
        14.14094,
        14.24254,
        14.33868,
        14.24254,
        14.52853,
        14.32117,
        14.66836,
        14.461,
        14.80819,
        14.60083,
        14.88682,
        14.79068,
        14.88682,
        14.98842,
        14.895,
        15.19229,
        14.82031,
        15.39101,
        14.67989,
        15.53902,
        14.53947,
        15.68703,
        14.34494,
        15.77208,
        14.14094,
        15.77462,
        13.93085,
        15.78024,
        13.72744,
        15.69914,
        13.57883,
        15.55054,
        13.43022,
        15.40192,
        13.34913,
        15.19851,
        13.35473,
        14.98842
      ],
      "segments": [
        1,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        5
      ]
    },
    {
      "type": "shape",
      "borderWidth": 0.28376,
      "borderColor": "#e4e9f7",
      "pixelPerfect": true,
      "points": [
        13.35473,
        14.98842,
        13.35729,
        14.78442,
        13.44233,
        14.5899,
        13.59034,
        14.44947,
        13.73835,
        14.30905,
        13.93708,
        14.23436,
        14.14094,
        14.24254,
        14.33868,
        14.24254,
        14.52853,
        14.32117,
        14.66836,
        14.461,
        14.80819,
        14.60083,
        14.88682,
        14.79068,
        14.88682,
        14.98842,
        14.895,
        15.19229,
        14.82031,
        15.39101,
        14.67989,
        15.53902,
        14.53947,
        15.68703,
        14.34494,
        15.77208,
        14.14094,
        15.77462,
        13.93085,
        15.78024,
        13.72744,
        15.69914,
        13.57883,
        15.55054,
        13.43022,
        15.40192,
        13.34913,
        15.19851,
        13.35473,
        14.98842
      ],
      "segments": [
        1,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        5
      ]
    },
    {
      "type": "shape",
      "background": "#ffffff",
      "pixelPerfect": true,
      "opacity": 0.1,
      "points": [
        6.79296,
        11.95449,
        14.77595,
        9.5858,
        4.69641,
        9.5858,
        4.69641,
        11.95449,
        6.79296,
        11.95449,
        6.79296,
        11.95449
      ],
      "segments": [
        1,
        2,
        2,
        2,
        2,
        2,
        5
      ]
    }
  ]
};

// 3. 工具函数：去重重复的坐标点（解决冗余坐标问题）
const deduplicatePoints = (points: number[], segments: number[]): { cleanPoints: number[], cleanSegments: number[] } => {
  const cleanPoints: number[] = [];
  const cleanSegments: number[] = [];
  let lastX = NaN;
  let lastY = NaN;

  let pointIdx = 0;
  if (!segments){
    return { cleanPoints, cleanSegments }
  }
  segments.forEach((seg) => {
    switch (seg) {
      case 1: // 起点
        const x = points[pointIdx];
        const y = points[pointIdx + 1];
        cleanPoints.push(x, y);
        cleanSegments.push(seg);
        lastX = x;
        lastY = y;
        pointIdx += 2;
        break;
      case 2: // 直线
        const x2 = points[pointIdx];
        const y2 = points[pointIdx + 1];
        // 仅保留非重复的坐标
        if (x2 !== lastX || y2 !== lastY) {
          cleanPoints.push(x2, y2);
          cleanSegments.push(seg);
          lastX = x2;
          lastY = y2;
        }
        pointIdx += 2;
        break;
      case 3: // 新增：无操作/重复点，跳过
        pointIdx += 2;
        break;
      case 4: // 贝塞尔曲线（保留原逻辑，兼容旧数据）
        const cp1x = points[pointIdx];
        const cp1y = points[pointIdx + 1];
        const cp2x = points[pointIdx + 2];
        const cp2y = points[pointIdx + 3];
        const endX = points[pointIdx + 4];
        const endY = points[pointIdx + 5];
        cleanPoints.push(cp1x, cp1y, cp2x, cp2y, endX, endY);
        cleanSegments.push(seg);
        lastX = endX;
        lastY = endY;
        pointIdx += 6;
        break;
      case 5: // 闭合路径
        cleanSegments.push(seg);
        break;
      default:
        break;
    }
  });

  return { cleanPoints, cleanSegments };
};

// 4. 路径解析工具函数（支持segments:3，兼容去重后的坐标）
const parsePath = (points: number[], segments: number[]): string => {
  // 先去重
  const { cleanPoints, cleanSegments } = deduplicatePoints(points, segments);
  
  let pathStr = '';
  let pointIdx = 0;

  cleanSegments.forEach((segType) => {
    switch (segType) {
      case 1: // 起点 (Move To)
        const x = cleanPoints[pointIdx];
        const y = cleanPoints[pointIdx + 1];
        pathStr += `M ${x.toFixed(4)} ${y.toFixed(4)} `;
        pointIdx += 2;
        break;
      case 2: // 直线 (Line To)
        const x2 = cleanPoints[pointIdx];
        const y2 = cleanPoints[pointIdx + 1];
        pathStr += `L ${x2.toFixed(4)} ${y2.toFixed(4)} `;
        pointIdx += 2;
        break;
      case 3: // 新增：无操作，跳过
        break;
      case 4: // 三次贝塞尔曲线 (Cubic Bezier)
        const cp1x = cleanPoints[pointIdx];
        const cp1y = cleanPoints[pointIdx + 1];
        const cp2x = cleanPoints[pointIdx + 2];
        const cp2y = cleanPoints[pointIdx + 3];
        const endX = cleanPoints[pointIdx + 4];
        const endY = cleanPoints[pointIdx + 5];
        pathStr += `C ${cp1x.toFixed(4)} ${cp1y.toFixed(4)}, ${cp2x.toFixed(4)} ${cp2y.toFixed(4)}, ${endX.toFixed(4)} ${endY.toFixed(4)} `;
        pointIdx += 6;
        break;
      case 5: // 闭合路径 (Close Path)
        pathStr += 'Z ';
        break;
      default:
        break;
    }
  });

  return pathStr.trim();
};

// 5. 渐变解析优化：适配大坐标值，转换为相对百分比
const parseGradient = (pack: (string | number)[], id: string, width: number, height: number) => {
  if (!pack || pack[0] !== 'L') return null;

  // 提取渐变参数
  const [, x1, y1, x2, y2, , , , , , , , ...colorStops] = pack;
  
  // 关键优化：将绝对大坐标转换为相对画布的百分比（解决渐变偏移问题）
  const relX1 = (Number(x1) / 1000) * 100; // 缩放适配
  const relY1 = (Number(y1) / 1000) * 100;
  const relX2 = (Number(x2) / 1000) * 100;
  const relY2 = (Number(y2) / 1000) * 100;

  // 解析色标
  const stops = [];
  for (let i = 0; i < colorStops.length; i += 2) {
    const color = colorStops[i] as string;
    const offset = (colorStops[i + 1] as number) * 100;
    stops.push(
      <stop key={i} offset={`${offset}%`} stopColor={color} stopOpacity={1} />
    );
  }

  return (
    <linearGradient
      id={id}
      x1={`${relX1.toFixed(2)}%`}
      y1={`${relY1.toFixed(2)}%`}
      x2={`${relX2.toFixed(2)}%`}
      y2={`${relY2.toFixed(2)}%`}
      gradientUnits="objectBoundingBox" // 改为相对形状边界，适配性更好
    >
      {stops}
    </linearGradient>
  );
};

// 6. 核心渲染组件
const CustomVectorGraphic: React.FC = () => {
  // 缓存解析结果，避免重复计算
  const renderData = useMemo(() => {
    const gradients: React.ReactElement[] = [];
    const paths: { d: string; fill: string; pixelPerfect: boolean }[] = [];

    vectorData.comps.forEach((shape, idx) => {
      // 解析路径（支持segments:3，去重冗余坐标）
      const d = parsePath(shape.points, shape.segments);
      
      // 处理填充（渐变/纯色）
      let fill = shape.background || 'transparent';
      if (shape.gradientPack) {
        const gradId = `grad-${idx}`;
        // 传入画布宽高，优化渐变解析
        const gradient = parseGradient(shape.gradientPack, gradId, vectorData.width, vectorData.height);
        if (gradient) gradients.push(gradient);
        fill = `url(#${gradId})`;
      }

      paths.push({ d, fill, pixelPerfect: shape.pixelPerfect });
    });

    return { gradients, paths };
  }, []);

  return (
    <svg
      width={vectorData.width}
      height={vectorData.height}
      viewBox={`0 0 ${vectorData.width} ${vectorData.height}`}
      style={{ 
        display: 'block',
        border: '1px solid #eee',
        background: 'transparent',
        // 适配负坐标（部分点y=-0.00001）
        overflow: 'visible'
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 定义渐变 */}
      <defs>{renderData.gradients}</defs>
      
      {/* 渲染所有形状路径 */}
      {renderData.paths.map((path, idx) => (
        <path
          key={idx}
          d={path.d}
          fill={path.fill}
          // 像素对齐优化
          shapeRendering={path.pixelPerfect ? 'crispEdges' : 'geometricPrecision'}
          // 修复负坐标裁剪问题
          clipPath="none"
        />
      ))}
    </svg>
  );
};

// 7. 导出组件
export default CustomVectorGraphic;