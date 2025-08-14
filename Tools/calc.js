/**
 * Bikram Calculator - Hindu Astrological Calendar with panchanga (Universal Library)
 * Copyright (C) 2025 Khumnath Cg <nath.khum@gmail.com>
 *
 * This script is a pure JavaScript library for astronomical calculations
 * and can be used in both QML and web browsers.
 */

const Panchanga = (function() {
    'use strict';

    // Surya Siddhanta Constants
    var YugaRotation = {
        'star': 1582237828, 'sun': 4320000, 'moon': 57753336,
        'mercury': 17937060, 'venus': 7022376, 'mars': 2296832,
        'jupiter': 364220, 'saturn': 146568, 'Candrocca': 488203,
        'Rahu': -232238
    };
    var YugaCivilDays = 1577917828;
    var KaliEpoch = 588465.5;
    var PlanetApogee = { 'sun': 77 + 17 / 60 };
    var PlanetCircumm = { 'sun': 13 + 50 / 60, 'moon': 31 + 50 / 60 };
    var rad = 180 / Math.PI;

    // Panchanga Names
    var solarMonths = [
        "वैशाख", "ज्येष्ठ", "आषाढ", "श्रावण", "भाद्रपद", "आश्विन",
        "कार्तिक", "मार्गशीर्ष", "पौष", "माघ", "फाल्गुन", "चैत्र"
    ];

    // Helper Functions
    function zero360(x) { return x - Math.floor(x / 360) * 360; }
    function sinDeg(deg) { return Math.sin(deg / rad); }
    function arcsinDeg(x) { return Math.asin(x) * rad; }

    function toJulianDay(year, month, day) {
        var m = month + 1;
        var y = year;
        if (m <= 2) { y--; m += 12; }
        var a = Math.floor(y / 100);
        var b = 2 - a + Math.floor(a / 4);
        return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
    }

    function fromJulianDay(jd) {
        jd += 0.5;
        var z = Math.floor(jd);
        var f = jd - z;
        var a;
        if (z < 2299161) {
            a = z;
        } else {
            var alpha = Math.floor((z - 1867216.25) / 36524.25);
            a = z + 1 + alpha - Math.floor(alpha / 4);
        }
        var b = a + 1524;
        var c = Math.floor((b - 122.1) / 365.25);
        var d = Math.floor(365.25 * c);
        var e = Math.floor((b - d) / 30.6001);
        var day = Math.floor(b - d - Math.floor(30.6001 * e) + f);
        var month = (e < 14) ? e - 1 : e - 13;
        var year = (month > 2) ? c - 4716 : c - 4715;
        return new Date(Date.UTC(year, month - 1, day));
    }

    // Core Surya Siddhanta Calculations
    function meanLongitude(ahar, rotation) {
        return zero360(rotation * ahar * 360 / YugaCivilDays);
    }

    function mandaEquation(meanLong, apogee, circ) {
        var arg = meanLong - apogee;
        return arcsinDeg(circ / 360 * sinDeg(arg));
    }

    function trueLongitudeSun(ahar) {
        var meanLong = meanLongitude(ahar, YugaRotation.sun);
        var manda = mandaEquation(meanLong, PlanetApogee.sun, PlanetCircumm.sun);
        return zero360(meanLong - manda);
    }

    function trueLongitudeMoon(ahar) {
        var meanLong = meanLongitude(ahar, YugaRotation.moon);
        var apogee = meanLongitude(ahar, YugaRotation.Candrocca) + 90;
        var manda = mandaEquation(meanLong, apogee, PlanetCircumm.moon);
        return zero360(meanLong - manda);
    }

    function findNewMoon(ahar) {
        var getElongation = function(a) { return zero360(trueLongitudeMoon(a) - trueLongitudeSun(a)); };
        var guess = ahar;
        for (var i = 0; i < 10; i++) {
            var elong = getElongation(guess);
            if (elong < 5 || elong > 355) break;
            var correction = (elong < 180 ? -elong : 360 - elong) / 12.19;
            guess += correction;
        }
        var lo = guess - 2, hi = guess + 2;
        for (var j = 0; j < 30; j++) {
            var mid = (lo + hi) / 2;
            var em = getElongation(mid);
            if (em < 180) { hi = mid; } else { lo = mid; }
        }
        return (lo + hi) / 2;
    }

    function getTslong(ahar) {
        var t1 = (YugaRotation.sun * ahar / YugaCivilDays);
        t1 -= Math.floor(t1);
        var mslong = 360 * t1;
        var x1 = mslong - PlanetApogee.sun;
        var y1 = PlanetCircumm.sun / 360;
        var y2 = sinDeg(x1);
        var y3 = y1 * y2;
        var x2 = arcsinDeg(y3);
        var x3 = mslong - x2;
        return x3;
    }

    function todaySauraMasaFirstP(ahar) {
        var tslong_today = getTslong(ahar);
        var tslong_tomorrow = getTslong(ahar + 1);
        tslong_today -= Math.floor(tslong_today / 30) * 30;
        tslong_tomorrow -= Math.floor(tslong_tomorrow / 30) * 30;
        return (25 < tslong_today && tslong_tomorrow < 5);
    }

    function getSauraMasaDay(ahar) {
        try {
            if (todaySauraMasaFirstP(ahar)) {
                var day = 1;
                var tslong_tomorrow = getTslong(ahar + 1);
                var month = Math.floor(tslong_tomorrow / 30) % 12;
                month = (month + 12) % 12;
                return { m: month, d: day };
            } else {
                var yesterday = getSauraMasaDay(ahar - 1);
                return { m: yesterday.m, d: yesterday.d + 1 };
            }
        } catch (e) {
            return { m: 0, d: 1 };
        }
    }

    function fromGregorianAstronomical(gYear, gMonth, gDay) {
        var julian = toJulianDay(gYear, gMonth - 1, gDay);
        var ahar = julian - KaliEpoch;
        var sauraMasaResult = getSauraMasaDay(ahar);
        var saura_masa_num = sauraMasaResult.m;
        var saura_masa_day = sauraMasaResult.d;
        var YearKali = Math.floor(ahar * YugaRotation.sun / YugaCivilDays);
        var YearSaka = YearKali - 3179;
        var nepalimonth = saura_masa_num % 12;
        var year = YearSaka + 135 + Math.floor((saura_masa_num - nepalimonth) / 12);
        var month = (saura_masa_num + 12) % 12 + 1;
        return {
            year: year,
            monthIndex: month - 1,
            day: saura_masa_day,
            monthName: solarMonths[month - 1]
        };
    }

    function calculateAdhikaMasa(ahar) {
        var lunarMonthStart = findNewMoon(ahar);
        if (lunarMonthStart > ahar) {
            lunarMonthStart = findNewMoon(lunarMonthStart - 29.530588853);
        }
        var lunarMonthEnd = findNewMoon(lunarMonthStart + 29.530588853);
        var sunLongStart = trueLongitudeSun(lunarMonthStart);
        var sunLongEnd = trueLongitudeSun(lunarMonthEnd);
        var startSign = Math.floor(sunLongStart / 30);
        var endSign = Math.floor(sunLongEnd / 30);
        var signCrossings = 0;
        var currentSign = startSign;
        for (var i = 1; i <= 29; i++) {
            var checkAhar = lunarMonthStart + i;
            var checkSunLong = trueLongitudeSun(checkAhar);
            var checkSign = Math.floor(checkSunLong / 30);
            if (checkSign < currentSign) {
                checkSign += 12;
            }
            if (checkSign > currentSign) {
                signCrossings += (checkSign - currentSign);
                currentSign = checkSign % 12;
            }
        }
        if (endSign < currentSign) {
            endSign += 12;
        }
        if (endSign > currentSign) {
            signCrossings += (endSign - currentSign);
        }
        if (signCrossings === 0) {
            return "अधिक " + solarMonths[startSign];
        }
        if (signCrossings >= 2) {
            var skippedSign = (startSign + 1) % 12;
            return "क्षय " + solarMonths[skippedSign];
        }
        return "छैन";
    }

    function toBikramSambat(gregorianDate) {
        var result = fromGregorianAstronomical(
            gregorianDate.getUTCFullYear(),
            gregorianDate.getUTCMonth() + 1,
            gregorianDate.getUTCDate()
        );
        result.isComputed = true;
        return result;
    }

    // Publicly exposed functions
    return {
        toJulianDay: toJulianDay,
        fromJulianDay: fromJulianDay,
        KaliEpoch: KaliEpoch,
        calculateAdhikaMasa: calculateAdhikaMasa,
        toBikramSambat: toBikramSambat,
        findNewMoon: findNewMoon
    };
})();
