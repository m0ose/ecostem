//
//  These are the anderson 13 fuel types, FBFM13
//
//
// sources:
//   http://www.landfire.gov/NationalProductDescriptions1.php
//   http://www.doeal.gov/SWEIS/OtherDocuments/477%20anderson1982.pdf
//
//  note: short descriptions came from simtable and may not be correct.
//
// json was parsed with http://jsbeautifier.org/
// measurements are in chains which translate to 1 chain = 66 feet (20.1168 meters)
// I'm not sure what speed is in
//   matrix:
//      st.fueltype.getSpread : returns meters per hour of movement.
//
// 
var st = {
    globals: {
        metersPerChain: 20.1168,
        ticksPerHour: 1,
    },
}

    function fitFuel(index) {
        var fuel = anderson13Fuels.getFuel(index)
        console.log(fuel)
        //if( ! fuel.matrix){
        //return false
        //}
        var matrix = fuel.matrix
        var a = numeric.clone(matrix.slice(1, 14)) //lose the first and last rows
        var x = numeric.getBlock(a, [0, 0], [12, 0])
        x = numeric.transpose(x)
        //var b = numeric.getBlock( a, )
        //console.log(a)
        var b = numeric.getBlock(a, [0, 1], [12, 12]) //lose the first column
        return b
    }

    function getSamples(index) {
        var fuel = anderson13Fuels.getFuel(index)
        console.log(fuel)
        if( ! fuel.matrix){
            return false
        }
        var matrix = fuel.matrix
        var samples = []
        var max = -1

        for (var i = matrix.length - 2; i > 0; i--) {
            var row = matrix[i]
            for (var j = row.length - 1; j > 0; j--) {
                var z = row[j]
                if (z >= max) {
                    max = z
                } else {
                    samples.push([matrix[0][j], row[0], z])
                }
            }
        }
        return samples
    }

    function prepSamples(samples) {
        var xs = []
        var zs = []
        for (var i = 0; i < samples.length; i++) {
            var sam = samples[i]
            zs.push(sam[2])
            var x = sam[0]
            var y = sam[1]
            var a = [1, x, y, x * x, y * y, x * x * x, y * y * y]
            xs.push(a)
        }
        return [xs, zs]

    }

    function fit(index) {
        var samp = getSamples(index)
        if(!samp){
            console.log('Fail to fit. No matrix')
            return false
        }
        var prep = prepSamples(samp)
        var x = prep[0]
        var z = prep[1]
        var xtx = numeric.dot(numeric.transpose(x), x)
        var inv_xtx = numeric.inv(xtx)
        var left = numeric.dot(inv_xtx, numeric.transpose(x))
        var a = numeric.dot(left, z)
        return a
    }

var anderson13Fuels = {
    getSpread: function(fuelindex, slopeDegrees, windSpeedMilesPerHour, humidity) {
        var slopeIndex = Math.round(Math.max(0, Math.min(60, slopeDegrees)) / 5) + 1;

        var windSpeedMiles = windSpeedMilesPerHour;

        //Negative slope, subtract factor from the wind
        if (slopeDegrees < 0) {
            windSpeedMiles = windSpeedMiles + slopeDegrees / 2;
        }
        // 0 < wind < 60
        windSpeedMiles = Math.max(0, Math.min(200000, windSpeedMiles))

        var windIndex = Math.round(windSpeedMiles / 5) + 1;
        windIndex = Math.max(1, Math.min(13, windIndex))

        var fuelType = this[fuelindex]
        if (!fuelType) {
            //       console.error("Error: Fuel type not found," + fuelindex)
            return 0;
        }
        if (!fuelType.matrix) { //towns,lakes, roads...
            return 0;
        }
        if (!fuelType.matrix[slopeIndex] || !fuelType.matrix[slopeIndex][windIndex]) {
            return 0;
        }
        var spreadRate = fuelType.matrix[slopeIndex][windIndex];
        spreadRate = spreadRate * st.globals.metersPerChain; //return in meters per hour
        return spreadRate;
    },
    getFuel: function(fuelIndex) {
        var fuel = this[fuelIndex];
        if (!fuel) {
            fuel = this[0];
        }
        return fuel;
    },
    getHandCrewSpeed1: function(fuelIndex) {
        //  hand crew speed in meters per tick
        var fuel = this.getFuel(fuelIndex)
        if (fuelIndex == 98) {
            return 10
        } //water
        if (!fuel.handCrewSpeed1) {
            fuel = this.getFuel(0)
        }
        return (fuel.handCrewSpeed1 * st.globals.metersPerChain) / st.globals.ticksPerHour;
    },
    getHandCrewSpeed2: function(fuelIndex) {
        //  hand crew speed in meters per tick
        var fuel = this.getFuel(fuelIndex)
        if (fuelIndex == 98) {
            return 10
        } //water
        if (!fuel.handCrewSpeed2) {
            fuel = this.getFuel(0)
        }
        return (fuel.handCrewSpeed2 * st.globals.metersPerChain) / st.globals.ticksPerHour;
    },
    "0": {
        "index": 0,
        "name": "NoData",
        "r": 0,
        "g": 0,
        "b": 0,
        "longDescription": "NoData",
        "shortDescription": "NoData",
        "moistureExtinction": 0,
        "handCrewSpeed1": 60, //a person can walk at about 6 km / hour
        "handCrewSpeed2": 60, //a person can walk at about 6 km / hour
    },
    "1": {
        "index": 1,
        "name": "FBFM1",
        "r": 255,
        "g": 255,
        "b": 189,
        "matrix": [
            [null, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [0, 4.4, 4.9, 6.2, 8.5, 11.7, 15.8, 20.8, 26.7, 33.6, 41.3, 50, 59.5, 70],
            [5, 99.3, 99.7, 101.1, 103.4, 106.5, 110.6, 115.7, 121.6, 128.4, 136.1, 144.8, 154.4, 164.8],
            [10, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3],
            [15, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3],
            [20, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3],
            [25, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3],
            [30, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3],
            [35, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3],
            [40, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3],
            [45, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3],
            [50, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3],
            [55, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3],
            [60, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3, 297.3],
            [0]
        ],
        "longDescription": "Surface fires that burn fine herbaceous fuels, cured and curing fuels, little shrub or timber present, primarily grasslands and savanna",
        "moistureExtinction": 0.12,
        "shortDescription": "Short Grass",
        "handCrewSpeed1": 30, //based on red fireline handbook, NWCG HANDBOOK, PMS410-1, NFES 0065, 2004, page A-30
        "handCrewSpeed2": 18,

    },
    "2": {
        "index": 2,
        "name": "FBFM2",
        "r": 255,
        "g": 255,
        "b": 0,
        "matrix": [
            [null, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [0, 2.5, 2.7, 3.2, 4, 5.1, 6.5, 8.2, 10.3, 12.6, 15.3, 18.3, 21.6, 25.3],
            [5, 39.9, 40, 40.5, 41.3, 42.4, 43.8, 45.6, 47.6, 50, 52.7, 55.7, 59, 62.6],
            [10, 135.3, 135.5, 136, 136.8, 137.9, 139.3, 141, 143.1, 145.4, 148.1, 151.1, 154.4, 158.1],
            [15, 281.5, 281.6, 282.1, 282.9, 284, 285.4, 287.2, 289.2, 291.6, 294.3, 297.3, 300.6, 304.2],
            [20, 474.8, 475, 475.4, 476.2, 477.3, 478.8, 480.5, 482.5, 484.9, 487.6, 490.6, 493.9, 497.5],
            [25, 713.1, 713.2, 713.7, 714.5, 715.6, 717, 718.7, 720.8, 723.2, 725.9, 728.9, 732.2, 735.8],
            [30, 994.6, 994.7, 995.2, 996, 997.1, 998.5, 1000.2, 1002.3, 1004.7, 1007.3, 1010.3, 1013.6, 1017.3],
            [35, 1317.9, 1318.1, 1318.6, 1319.4, 1320.5, 1321.9, 1323.6, 1325.7, 1328, 1330.7, 1333.7, 1337, 1340.7],
            [40, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6],
            [45, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6],
            [50, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6],
            [55, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6],
            [60, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6, 1437.6],
            [0]
        ],
        "longDescription": "Burns fine, herbaceous fuels, stand is curing or dead, may produce fire brands on oak or pine stands",
        "moistureExtinction": 0.15,
        "shortDescription": "Timber Understory",
        "handCrewSpeed1": 24, //based on red fireline handbook, NWCG HANDBOOK, PMS410-1, NFES 0065, 2004
        "handCrewSpeed2": 16,
    },
    "3": {
        "index": 3,
        "name": "FBFM3",
        "r": 229,
        "g": 196,
        "b": 11,
        "matrix": [
            [null, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [0, 4.9, 5.4, 6.7, 8.9, 11.9, 15.9, 20.7, 26.4, 33, 40.4, 48.8, 58, 68],
            [5, 128.8, 129.2, 130.5, 132.7, 135.8, 139.7, 144.5, 150.2, 156.8, 164.3, 172.6, 181.8, 191.9],
            [10, 312.1, 312.6, 313.9, 316.1, 319.2, 323.1, 327.9, 333.6, 340.2, 347.6, 356, 365.2, 375.3],
            [15, 527.6, 528.1, 529.4, 531.6, 534.6, 538.6, 543.4, 549.1, 555.7, 563.1, 571.5, 580.7, 590.7],
            [20, 767, 767.5, 768.8, 771, 774.1, 778, 782.8, 788.5, 795.1, 802.5, 810.9, 820.1, 830.2],
            [25, 1026, 1026.4, 1027.7, 1029.9, 1033, 1036.9, 1041.8, 1047.5, 1054, 1061.5, 1069.8, 1079, 1089.1],
            [30, 1301.6, 1302.1, 1303.4, 1305.6, 1308.6, 1312.6, 1317.4, 1323.1, 1329.7, 1337.1, 1345.4, 1354.6, 1364.7],
            [35, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8],
            [40, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8],
            [45, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8],
            [50, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8],
            [55, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8],
            [60, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8, 1374.8],
            [0]
        ],
        "longDescription": "Most intense fire of grass group, spreads quickly with wind, one third of stand dead or cured, stands average 3 ft tall",
        "moistureExtinction": 0.25,
        "shortDescription": "Tall Grass",
        "handCrewSpeed1": 5, //based on red fireline handbook, NWCG HANDBOOK, PMS410-1, NFES 0065, 2004
        "handCrewSpeed2": 3,
    },
    "4": {
        "index": 4,
        "name": "FBFM4",
        "r": 255,
        "g": 211,
        "b": 127,
        "matrix": [
            [null, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [0, 4.6, 5, 5.9, 7.6, 9.8, 12.8, 16.3, 20.6, 25.4, 31, 37.2, 44, 51.5],
            [5, 85.1, 85.4, 86.4, 88, 90.3, 93.2, 96.8, 101, 105.9, 111.4, 117.6, 124.4, 131.9],
            [10, 219.8, 220.2, 221.1, 222.8, 225, 228, 231.5, 235.8, 240.6, 246.2, 252.3, 259.2, 266.7],
            [15, 387.3, 387.7, 388.6, 390.3, 392.5, 395.5, 399, 403.3, 408.1, 413.7, 419.8, 426.7, 434.2],
            [20, 580.4, 580.7, 581.7, 583.3, 585.6, 588.5, 592.1, 596.3, 601.2, 606.7, 612.9, 619.7, 627.2],
            [25, 795, 795.3, 796.3, 797.9, 800.2, 803.2, 806.7, 811, 815.8, 821.4, 827.5, 834.4, 841.8],
            [30, 1028.5, 1028.9, 1029.8, 1031.5, 1033.7, 1036.7, 1040.2, 1044.5, 1049.3, 1054.9, 1061.1, 1067.9, 1075.4],
            [35, 1279.1, 1279.4, 1280.4, 1282, 1284.3, 1287.2, 1290.8, 1295, 1299.9, 1305.4, 1311.6, 1318.4, 1325.9],
            [40, 1545.1, 1545.4, 1546.4, 1548, 1550.3, 1553.2, 1556.8, 1561, 1565.9, 1571.4, 1577.6, 1584.4, 1591.9],
            [45, 1825.5, 1825.8, 1826.8, 1828.4, 1830.7, 1833.6, 1837.2, 1841.4, 1846.3, 1851.8, 1858, 1864.8, 1872.3],
            [50, 2119.3, 2119.6, 2120.6, 2122.2, 2124.5, 2127.4, 2131, 2135.2, 2140.1, 2145.6, 2151.8, 2158.6, 2166.1],
            [55, 2425.7, 2426, 2427, 2428.6, 2430.9, 2433.8, 2437.4, 2441.6, 2446.5, 2452, 2458.2, 2465, 2472.5],
            [60, 2744.1, 2744.4, 2745.4, 2747, 2749.3, 2752.2, 2755.8, 2760, 2764.9, 2770.4, 2776.6, 2783.4, 2790.9],
            [0]
        ],
        "longDescription": "Fast spreading fire, continuous overstory, flammable foliage and dead woody material, deep litter layer can inhibit suppression",
        "moistureExtinction": 0.20,
        "shortDescription": "Chapparral",
        "handCrewSpeed1": 5, //based on red fireline handbook, NWCG HANDBOOK, PMS410-1, NFES 0065, 2004
        "handCrewSpeed2": 3,
    },
    "5": {
        "index": 5,
        "name": "FBFM5",
        "r": 255,
        "g": 170,
        "b": 0,
        "matrix": [
            [null, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [0, 1.3, 1.4, 1.7, 2.2, 2.9, 3.9, 5, 6.3, 7.9, 9.6, 11.6, 13.8, 16.1],
            [5, 28, 28.1, 28.4, 28.9, 29.6, 30.6, 31.7, 33, 34.6, 36.3, 38.3, 40.4, 42.8],
            [10, 71.5, 71.6, 71.9, 72.4, 73.1, 74, 75.2, 76.5, 78.1, 79.8, 81.8, 83.9, 86.3],
            [15, 124.8, 124.9, 125.2, 125.8, 126.5, 127.4, 128.5, 129.9, 131.4, 133.2, 135.1, 137.3, 139.7],
            [20, 185.8, 185.9, 186.2, 186.7, 187.5, 188.4, 189.5, 190.9, 192.4, 194.2, 196.1, 198.3, 200.6],
            [25, 253.2, 253.3, 253.6, 254.1, 254.8, 255.8, 256.9, 258.2, 259.8, 261.5, 263.5, 265.6, 268],
            [30, 326.1, 326.2, 326.5, 327, 327.8, 328.7, 329.8, 331.2, 332.7, 334.5, 336.4, 338.1, 338.1],
            [35, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1],
            [40, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1],
            [45, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1],
            [50, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1],
            [55, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1],
            [60, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1, 338.1],
            [0]
        ],
        "longDescription": "Low intensity fires, young, green shrubs with little dead material, fuels consist of litter from understory",
        "moistureExtinction": 0.20,
        "shortDescription": "Brush",
        "handCrewSpeed1": 6, //based on red fireline handbook, NWCG HANDBOOK, PMS410-1, NFES 0065, 2004
        "handCrewSpeed2": 4,
    },
    "6": {
        "index": 6,
        "name": "FBFM6",
        "r": 205,
        "g": 170,
        "b": 102,
        "matrix": [
            [null, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [0, 1.9, 2, 2.4, 3.1, 4.1, 5.3, 6.8, 8.6, 10.6, 12.9, 15.5, 18.4, 21.5],
            [5, 36.9, 37.1, 37.5, 38.2, 39.1, 40.4, 41.9, 43.6, 45.7, 48, 50.6, 53.4, 56.6],
            [10, 90.7, 90.8, 91.2, 91.9, 92.9, 94.1, 95.6, 97.4, 99.4, 101.7, 104.3, 107.2, 110.3],
            [15, 154.8, 154.9, 155.3, 156, 157, 158.2, 159.7, 161.5, 163.5, 165.8, 168.4, 171.3, 174.4],
            [20, 226.8, 226.9, 227.3, 228, 228.9, 230.2, 231.7, 233.4, 235.5, 236.2, 236.2, 236.2, 236.2],
            [25, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2],
            [30, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2],
            [35, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2],
            [40, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2],
            [45, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2],
            [50, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2],
            [55, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2],
            [60, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2, 236.2],
            [0]
        ],
        "longDescription": "Broad range of shrubs, fire requires moderate winds to maintain flame at shrub height, or will drop to the ground with low winds",
        "moistureExtinction": 0.25,
        "shortDescription": "Shrub",
        "handCrewSpeed1": 7, //based on red fireline handbook, NWCG HANDBOOK, PMS410-1, NFES 0065, 2004
        "handCrewSpeed2": 5,
    },
    "7": {
        "index": 7,
        "name": "FBFM7",
        "r": 137,
        "g": 112,
        "b": 68,
        "matrix": [
            [null, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [0, 1.5, 1.6, 1.9, 2.5, 3.3, 4.3, 5.6, 7.1, 8.8, 10.7, 12.9, 15.3, 17.9],
            [5, 31.6, 31.7, 32.1, 32.6, 33.4, 34.5, 35.7, 37.2, 38.9, 40.9, 43, 45.4, 48.1],
            [10, 77.5, 77.6, 78, 78.5, 79.3, 80.4, 81.6, 83.1, 84.8, 86.8, 88.9, 91.3, 94],
            [15, 132.1, 132.2, 132.6, 133.2, 134, 135, 136.2, 137.7, 139.4, 141.4, 143.6, 146, 148.6],
            [20, 193.3, 193.4, 193.8, 194.3, 195.1, 196.2, 197.4, 198.9, 200.6, 202.6, 204.7, 207.1, 209.8],
            [25, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4],
            [30, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4],
            [35, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4],
            [40, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4],
            [45, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4],
            [50, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4],
            [55, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4],
            [60, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4, 228.4],
            [0]
        ],
        "longDescription": "Foliage highly flammable, allowing fire to reach shrub strata levels, shrubs generally 2 to 6 feet high",
        "moistureExtinction": 0.40,
        "shortDescription": "Southern Rough",
        "handCrewSpeed1": 4, //based on red fireline handbook, NWCG HANDBOOK, PMS410-1, NFES 0065, 2004
        "handCrewSpeed2": 2,
    },
    "8": {
        "index": 8,
        "name": "FBFM8",
        "r": 211,
        "g": 255,
        "b": 189,
        "matrix": [
            [null, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [0, 0.3, 0.3, 0.3, 0.3, 0.4, 0.5, 0.6, 0.7, 0.9, 1, 1.2, 1.4, 1.6],
            [5, 2.2, 2.2, 2.3, 2.3, 2.4, 2.4, 2.5, 2.7, 2.8, 3, 3.1, 3.3, 3.5],
            [10, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7],
            [15, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7],
            [20, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7],
            [25, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7],
            [30, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7],
            [35, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7],
            [40, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7],
            [45, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7],
            [50, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7],
            [55, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7],
            [60, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7, 5.7],
            [0]
        ],
        "longDescription": "Slow, ground burning fires, closed canopy stands with short needle conifers or hardwoods, litter consist mainly of needles and leaves, with little undergrowth, occasional flares with concentrated fuels",
        "moistureExtinction": 0.30,
        "shortDescription": "Short Leaf Litter",
        "handCrewSpeed1": 23, //based on red fireline handbook, NWCG HANDBOOK, PMS410-1, NFES 0065, 2004
        "handCrewSpeed2": 15,
    },
    "9": {
        "index": 9,
        "name": "FBFM9",
        "r": 112,
        "g": 168,
        "b": 0,
        "matrix": [
            [null, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [0, 0.9, 1, 1.1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.2, 3.9, 4.6, 5.3, 6.2],
            [5, 9.6, 9.6, 9.7, 9.9, 10.1, 10.5, 10.9, 11.4, 11.9, 12.5, 13.2, 14, 14.8],
            [10, 29.4, 29.5, 29.6, 29.8, 30, 30.3, 30.7, 31.2, 31.8, 32.4, 33.1, 33.8, 34.7],
            [15, 58.2, 58.3, 58.4, 58.5, 58.8, 59.1, 59.5, 60, 60.6, 61.2, 61.9, 62.6, 63.5],
            [20, 94.9, 95, 95.1, 95.3, 95.5, 95.8, 96.2, 96.7, 97.3, 97.9, 98.6, 99.3, 100.2],
            [25, 139, 139, 139.1, 139.3, 139.5, 139.9, 140.3, 140.7, 141.3, 141.9, 142.6, 143.4, 144.2],
            [30, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8],
            [35, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8],
            [40, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8],
            [45, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8],
            [50, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8],
            [55, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8],
            [60, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8, 146.8],
            [0]
        ],
        "longDescription": "Longer flames, quicker surface fires, closed canopy stands of long-needles or hardwoods, rolling leaves in fall can cause spotting, dead-down material can cause occasional crowning",
        "moistureExtinction": 0.25,
        "shortDescription": "Hardwood Litter",
        "handCrewSpeed1": 34, //based on red fireline handbook, NWCG HANDBOOK, PMS410-1, NFES 0065, 2004
        "handCrewSpeed2": 20,
    },
    "10": {
        "index": 10,
        "name": "FBFM10",
        "r": 38,
        "g": 114,
        "b": 0,
        "matrix": [
            [null, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [0, 0.9, 0.9, 1, 1.2, 1.5, 1.9, 2.3, 2.8, 3.4, 4.1, 4.9, 5.7, 6.6],
            [5, 9.6, 9.6, 9.7, 9.9, 10.2, 10.6, 11, 11.5, 12.1, 12.8, 13.5, 14.4, 15.3],
            [10, 24.3, 24.3, 24.4, 24.6, 24.9, 25.3, 25.7, 26.2, 26.8, 27.5, 28.2, 29.1, 30],
            [15, 42.7, 42.7, 42.8, 43, 43.3, 43.7, 44.1, 44.6, 45.2, 45.9, 46.6, 47.5, 48.4],
            [20, 63.9, 64, 64.1, 64.3, 64.6, 64.9, 65.4, 65.9, 66.5, 67.1, 67.9, 68.7, 69.6],
            [25, 87.6, 87.7, 87.8, 88, 88.3, 88.6, 89.1, 89.6, 90.2, 90.9, 91.6, 92.4, 93.4],
            [30, 113.5, 113.5, 113.7, 113.9, 114.1, 114.5, 114.9, 115.4, 116, 116.7, 117.5, 118.3, 119.2],
            [35, 141.3, 141.3, 141.5, 141.6, 141.9, 142.3, 142.7, 143.2, 143.8, 144.5, 145.3, 146.1, 147],
            [40, 170.9, 170.9, 171, 171.2, 171.5, 171.8, 172.3, 172.8, 173.4, 174.1, 174.8, 175.6, 176.6],
            [45, 202.1, 202.1, 202.2, 202.4, 202.7, 203, 203.5, 204, 204.6, 205.3, 206, 206.8, 207.8],
            [50, 234.8, 234.8, 234.9, 235.1, 235.4, 235.8, 236.2, 236.7, 237.3, 238, 238.7, 239.6, 240.5],
            [55, 269, 269, 269.1, 269.3, 269.6, 269.9, 270.4, 270.9, 271.5, 272.2, 272.9, 273.8, 274.7],
            [60, 304.5, 304.5, 304.7, 304.9, 305.1, 305.5, 305.9, 306.4, 307, 307.7, 308.5, 309.3, 310.2],
            [0]
        ],
        "longDescription": "Surface and ground fire more intense, dead-down fuels more abundant, frequent crowning and spotting causing fire control to be more difficult",
        "moistureExtinction": 0.25,
        "shortDescription": "Timber Litter",
        "handCrewSpeed1": 6, //based on red fireline handbook, NWCG HANDBOOK, PMS410-1, NFES 0065, 2004
        "handCrewSpeed2": 4,
    },
    "11": {
        "index": 11,
        "name": "FBFM11",
        "r": 232,
        "g": 190,
        "b": 255,
        "matrix": [
            [null, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [0, 0.6, 0.6, 0.7, 0.8, 1, 1.3, 1.6, 1.9, 2.3, 2.8, 3.3, 3.9, 4.5],
            [5, 6.5, 6.5, 6.6, 6.8, 6.9, 7.2, 7.5, 7.8, 8.3, 8.7, 9.2, 9.8, 10.4],
            [10, 13.7, 13.8, 13.9, 14, 14.2, 14.4, 14.7, 15.1, 15.5, 15.9, 16.5, 17, 17.7],
            [15, 21.6, 21.6, 21.7, 21.8, 22, 22.3, 22.6, 22.9, 23.3, 23.8, 24.3, 24.9, 25.5],
            [20, 29.8, 29.8, 29.9, 30.1, 30.3, 30.5, 30.8, 31.2, 31.6, 32, 32.5, 33.1, 33.7],
            [25, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6],
            [30, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6],
            [35, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6],
            [40, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6],
            [45, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6],
            [50, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6],
            [55, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6],
            [60, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6, 37.6],
            [0]
        ],
        "longDescription": "Fairly active fire, fuels consist of slash and herbaceous materials, slash originates from light partial cuts or thinning projects, fire is limited by spacing of fuel load and shade from overstory",
        "moistureExtinction": 0.15,
        "shortDescription": "Light Slash",
        "handCrewSpeed1": 15, //based on red fireline handbook, NWCG HANDBOOK, PMS410-1, NFES 0065, 2004
        "handCrewSpeed2": 9,
    },
    "12": {
        "index": 12,
        "name": "FBFM12",
        "r": 122,
        "g": 142,
        "b": 245,
        "matrix": [
            [null, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [0, 1.5, 1.5, 1.7, 2, 2.5, 3, 3.7, 4.5, 5.4, 6.5, 7.7, 9, 10.4],
            [5, 14.4, 14.5, 14.6, 15, 15.4, 15.9, 16.6, 17.4, 18.4, 19.4, 20.6, 21.9, 23.3],
            [10, 29.8, 29.9, 30, 30.4, 30.8, 31.3, 32, 32.8, 33.8, 34.8, 36, 37.3, 38.7],
            [15, 46.3, 46.4, 46.6, 46.9, 47.3, 47.9, 48.5, 49.3, 50.3, 51.3, 52.5, 53.8, 55.2],
            [20, 63.6, 63.6, 63.8, 64.1, 64.6, 65.1, 65.8, 66.6, 67.5, 68.6, 69.8, 71.1, 72.5],
            [25, 81.4, 81.5, 81.7, 82, 82.4, 83, 83.7, 84.5, 85.4, 86.4, 87.6, 88.9, 90.3],
            [30, 99.8, 99.8, 100, 100.3, 100.8, 101.3, 102, 102.8, 103.7, 104.8, 106, 107.3, 108.7],
            [35, 118.5, 118.6, 118.8, 119.1, 119.5, 120.1, 120.7, 121.6, 122.5, 123.5, 124.7, 126, 127.4],
            [40, 137.6, 137.7, 137.9, 138.2, 138.6, 139.2, 139.9, 140.7, 141.6, 142.6, 143.8, 145.1, 146.5],
            [45, 157.1, 157.1, 157.3, 157.6, 158.1, 158.6, 159.3, 160.1, 161, 162.1, 163.2, 164.5, 166],
            [50, 176.8, 176.8, 177, 177.3, 177.8, 178.3, 179, 179.8, 180.7, 181.8, 183, 184.3, 185.7],
            [55, 196.8, 196.8, 197, 197.3, 197.8, 198.3, 199, 199.8, 200.7, 201.8, 203, 204.2, 205.7],
            [60, 217, 217.1, 217.2, 217.5, 218, 218.5, 219.2, 220, 221, 222, 223.2, 224.5, 225.9],
            [0]
        ],
        "longDescription": "Rapid spreading and high intensity fires, dominated by slash resulting from heavy thinning projects and clearcuts, slash is mostly 3 inches or less in diameter, fire is usually sustained until there is a fuel break or a change in fuel type",
        "moistureExtinction": 0.20,
        "shortDescription": "Medium Slash",
        "handCrewSpeed1": 7, //based on red fireline handbook, NWCG HANDBOOK, PMS410-1, NFES 0065, 2004
        "handCrewSpeed2": 4,
    },
    "13": {
        "index": 13,
        "name": "FBFM13",
        "r": 197,
        "g": 0,
        "b": 255,
        "matrix": [
            [null, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [0, 2, 2.1, 2.3, 2.7, 3.2, 3.9, 4.8, 5.8, 7, 8.3, 9.8, 11.4, 13.2],
            [5, 17.5, 17.6, 17.8, 18.2, 18.7, 19.4, 20.3, 21.3, 22.5, 23.8, 25.2, 26.9, 28.7],
            [10, 36.1, 36.2, 36.5, 36.8, 37.4, 38.1, 38.9, 39.9, 41.1, 42.4, 43.9, 45.5, 47.3],
            [15, 56.2, 56.3, 56.5, 56.9, 57.5, 58.2, 59, 60, 61.2, 62.5, 64, 65.6, 67.4],
            [20, 77.3, 77.3, 77.6, 78, 78.5, 79.2, 80.1, 81.1, 82.2, 83.5, 85, 86.6, 88.4],
            [25, 99.1, 99.1, 99.4, 99.8, 100.3, 101, 101.9, 102.9, 104, 105.3, 106.8, 108.4, 110.2],
            [30, 121.5, 121.6, 121.8, 122.2, 122.7, 123.4, 124.3, 125.3, 126.5, 127.8, 129.2, 130.9, 132.7],
            [35, 144.5, 144.5, 144.8, 145.2, 145.7, 146.4, 147.3, 148.3, 149.4, 150.7, 152.2, 153.8, 155.6],
            [40, 167.9, 168, 168.2, 168.6, 169.1, 169.8, 170.7, 171.7, 172.9, 174.2, 175.6, 177.3, 179.1],
            [45, 191.7, 191.8, 192, 192.4, 193, 193.7, 194.5, 195.5, 196.7, 198, 199.5, 201.1, 202.9],
            [50, 216, 216, 216.3, 216.7, 217.2, 217.9, 218.8, 219.8, 220.9, 222.2, 223.7, 225.3, 227.1],
            [55, 240.5, 240.6, 240.8, 241.2, 241.8, 242.5, 243.3, 244.3, 245.5, 246.8, 248.3, 249.9, 251.7],
            [60, 265.4, 265.5, 265.7, 266.1, 266.6, 267.3, 268.2, 269.2, 270.4, 271.7, 273.2, 274.8, 276.6],
            [0]
        ],
        "longDescription": "Fire spreads quickly through smaller material and intensity builds slowly as large material ignites, continuous layer of slash larger than 3 inches in diameter predominates, resulting from clearcuts and heavy partial cuts, active flames sustained for long periods of time, fire is susceptible to spotting and weather conditions",
        "moistureExtinction": 0.25,
        "shortDescription": "Heavy Slash",
        "handCrewSpeed1": 5, //based on red fireline handbook, NWCG HANDBOOK, PMS410-1, NFES 0065, 2004
        "handCrewSpeed2": 3,
    },
    "91": {
        "index": 91,
        "name": "Urban",
        "r": 103,
        "g": 103,
        "b": 103,
        "longDescription": "Urban",
        "shortDescription": "Urban",
        "moistureExtinction": 0

    },
    "92": {
        "index": 92,
        "name": "Snow/Ice",
        "r": 224,
        "g": 224,
        "b": 224,
        "longDescription": "Snow/Ice",
        "shortDescription": "Snow/Ice",
        "moistureExtinction": 0

    },
    "93": {
        "index": 93,
        "name": "Agriculture",
        "r": 255,
        "g": 237,
        "b": 237,
        "longDescription": "Agriculture",
        "shortDescription": "Agriculture",
        "moistureExtinction": 0

    },
    "98": {
        "index": 98,
        "name": "Water",
        "r": 0,
        "g": 14,
        "b": 214,
        "longDescription": "Water",
        "shortDescription": "Water",
        "moistureExtinction": 0

    },
    "99": {
        "index": 99,
        "name": "Barren",
        "r": 77,
        "g": 110,
        "b": 112,
        "longDescription": "Barren",
        "shortDescription": "Barren",
        "moistureExtinction": 0

    },
    "404": {
        "index": "undefined",
        "name": "Undefined",
        "r": 200,
        "g": 75,
        "b": 75,
        "longDescription": "Undefined",
        "shortDescription": "Undefinend",
        "moistureExtinction": 0
    }
}