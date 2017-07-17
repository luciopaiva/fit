"use strict";

class FitRecordHeader {

    constructor () {
        this.headerType = -1;
        this.messageType = -1;
        this.messageTypeSpecific = -1;
        this.reserved = -1;
        this.localMessageType = -1;
    }
}

class FitMessage {

    /**
     * @param {FitRecordHeader} header
     */
    constructor (header) {
        this.header = header;
    }
}

class FitDefinitionMessage extends FitMessage {

    /**
     * @param {FitRecordHeader} header
     */
    constructor (header) {
        super(header);
        this.reserved = -1;
        this.architecture = -1;
        this.globalMessageNumber = -1;
        this.numberOfFields = 0;
        /** @type {FitDefinitionField[]} */
        this.fields = [];
        this.developerNumberOfFields = 0;
        this.developerFields = [];
    }
}

class FitDefinitionField {

    constructor () {
        this.fieldDefinitionNumber = 0;
        this.size = 0;
        this.baseType = 0;
    }
}

class FitDataMessage extends FitMessage {

    /**
     * @param {FitRecordHeader} header
     */
    constructor (header) {
        super(header);
    }
}

class FitMessageType {

    /**
     * @param {string} name
     * @param {Map<number, FitMessageField>} fieldById
     */
    constructor (name, fieldById) {
        this.name = name;
        this.fieldById = fieldById;
    }

    /**
     * @param {object} object
     * @return {Map<number, FitMessageType>}
     */
    static parseTypesFromObject(object) {
        const result = new Map();

        for (const messageNum of Object.keys(object)) {
            const typeObj = object[messageNum];
            const name = typeObj.name;
            delete typeObj.name;  // so the only properties left are field types
            const fieldById = FitMessageField.parseFieldsFromObject(typeObj);
            result.set(messageNum, new FitMessageType(name, fieldById));
        }

        return result;
    }
}

class FitMessageField {

    constructor (name, type, units, scale, offset) {
        this.name = name;
        this.type = type;
        this.units = units;
        this.scale = scale;
        this.offset = offset;
    }

    /**
     * @param {object} object
     * @return {Map<number, FitMessageField>}
     */
    static parseFieldsFromObject(object) {
        const result = new Map();

        for (const fieldNum of Object.keys(object)) {
            const typeObj = object[fieldNum];
            const name = typeObj.field;
            const type = typeObj.type;
            const scale = typeObj.scale;
            const offset = typeObj.offset;
            const units = typeObj.units;
            result.set(fieldNum, new FitMessageField(name, type, units, scale, offset));
        }

        return result;
    }
}

// Message types taken from Pierre Jacquier's easy-fit project
/*
 The MIT License (MIT)

 Copyright (c) 2015 Pierre Jacquier
 http://pierrejacquier.com | @pierremtb

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
const FIT_MESSAGE_TYPES = FitMessageType.parseTypesFromObject({
    0: {
        name: 'file_id',
        0: { field: 'type', type: 'file', scale: null, offset: '', units: '' },
        1: { field: 'manufacturer', type: 'manufacturer', scale: null, offset: '', units: '' },
        2: { field: 'product', type: 'uint16', scale: null, offset: '', units: '' },
        3: { field: 'serial_number', type: 'uint32z', scale: null, offset: '', units: '' },
        4: { field: 'time_created', type: 'date_time', scale: null, offset: '', units: '' },
        5: { field: 'number', type: 'uint16', scale: null, offset: '', units: '' },
        8: { field: 'product_name', type: 'string', scale: null, offset: '', units: '' },
    },
    1: {
        name: 'capabilities',
        0: { field: 'languages', type: 'uint8z', scale: null, offset: '', units: '' },
        1: { field: 'sports', type: 'sport_bits_0', scale: null, offset: '', units: '' },
        21: { field: 'workouts_supported', type: 'workout_capabilities', scale: null, offset: '', units: '' },
        23: { field: 'connectivity_supported', type: 'connectivity_capabilities', scale: null, offset: '', units: '' },
    },
    2: {
        name: 'device_settings',
        0: { field: 'active_time_zone', type: 'uint8', scale: null, offset: '', units: '' },
        1: { field: 'utc_offset', type: 'uint32', scale: null, offset: '', units: '' },
        2: { field: 'time_offset', type: 'uint32', scale: null, offset: '', units: 's' },
        5: { field: 'time_zone_offset', type: 'sint8', scale: 4, offset: '', units: 'hr' },
        55: { field: 'display_orientation', type: 'display_orientation', scale: null, offset: '', units: '' },
        56: { field: 'mounting_side', type: 'side', scale: null, offset: '', units: '' },
        94: { field: 'number_of_screens', type: 'uint8', scale: null, offset: '', units: '' },
        95: { field: 'smart_notification_display_orientation', type: 'display_orientation', scale: null, offset: '', units: '' },
    },
    3: {
        name: 'user_profile',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: 0, units: '' },
        0: { field: 'friendly_name', type: 'string', scale: null, offset: 0, units: '' },
        1: { field: 'gender', type: 'gender', scale: null, offset: 0, units: '' },
        2: { field: 'age', type: 'uint8', scale: null, offset: 0, units: 'years' },
        3: { field: 'height', type: 'uint8', scale: 100, offset: 0, units: 'm' },
        4: { field: 'weight', type: 'uint16', scale: 10, offset: 0, units: 'kg' },
        5: { field: 'language', type: 'language', scale: null, offset: 0, units: '' },
        6: { field: 'elev_setting', type: 'display_measure', scale: null, offset: 0, units: '' },
        7: { field: 'weight_setting', type: 'display_measure', scale: null, offset: 0, units: '' },
        8: { field: 'resting_heart_rate', type: 'uint8', scale: null, offset: 0, units: 'bpm' },
        9: { field: 'default_max_running_heart_rate', type: 'uint8', scale: null, offset: 0, units: 'bpm' },
        10: { field: 'default_max_biking_heart_rate', type: 'uint8', scale: null, offset: 0, units: 'bpm' },
        11: { field: 'default_max_heart_rate', type: 'uint8', scale: null, offset: 0, units: 'bpm' },
        12: { field: 'hr_setting', type: 'display_heart', scale: null, offset: 0, units: '' },
        13: { field: 'speed_setting', type: 'display_measure', scale: null, offset: 0, units: '' },
        14: { field: 'dist_setting', type: 'display_measure', scale: null, offset: 0, units: '' },
        16: { field: 'power_setting', type: 'display_power', scale: null, offset: 0, units: '' },
        17: { field: 'activity_class', type: 'activity_class', scale: null, offset: 0, units: '' },
        18: { field: 'position_setting', type: 'display_position', scale: null, offset: 0, units: '' },
        21: { field: 'temperature_setting', type: 'display_measure', scale: null, offset: 0, units: '' },
        22: { field: 'local_id', type: 'user_local_id', scale: null, offset: 0, units: '' },
        23: { field: 'global_id', type: 'byte', scale: null, offset: 0, units: '' },
        30: { field: 'height_setting', type: 'display_measure', scale: null, offset: 0, units: '' },
    },
    4: {
        name: 'hrm_profile',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: '', units: '' },
        0: { field: 'enabled', type: 'bool', scale: null, offset: '', units: '' },
        1: { field: 'hrm_ant_id', type: 'uint16z', scale: null, offset: '', units: '' },
        2: { field: 'log_hrv', type: 'bool', scale: null, offset: '', units: '' },
        3: { field: 'hrm_ant_id_trans_type', type: 'uint8z', scale: null, offset: '', units: '' },
    },
    5: {
        name: 'sdm_profile',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: '', units: '' },
        0: { field: 'enabled', type: 'bool', scale: null, offset: '', units: '' },
        1: { field: 'sdm_ant_id', type: 'uint16z', scale: null, offset: '', units: '' },
        2: { field: 'sdm_cal_factor', type: 'uint16', scale: 10, offset: '', units: '%' },
        3: { field: 'odometer', type: 'uint32', scale: 100, offset: '', units: 'm' },
        4: { field: 'speed_source', type: 'bool', scale: null, offset: '', units: '' },
        5: { field: 'sdm_ant_id_trans_type', type: 'uint8z', scale: null, offset: '', units: '' },
        7: { field: 'odometer_rollover', type: 'uint8', scale: null, offset: '', units: '' },
    },
    6: {
        name: 'bike_profile',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: 0, units: '' },
        0: { field: 'name', type: 'string', scale: null, offset: 0, units: '' },
        1: { field: 'sport', type: 'sport', scale: null, offset: 0, units: '' },
        2: { field: 'sub_sport', type: 'sub_sport', scale: null, offset: 0, units: '' },
        3: { field: 'odometer', type: 'uint32', scale: 100, offset: 0, units: 'm' },
        4: { field: 'bike_spd_ant_id', type: 'uint16z', scale: null, offset: 0, units: '' },
        5: { field: 'bike_cad_ant_id', type: 'uint16z', scale: null, offset: 0, units: '' },
        6: { field: 'bike_spdcad_ant_id', type: 'uint16z', scale: null, offset: 0, units: '' },
        7: { field: 'bike_power_ant_id', type: 'uint16z', scale: null, offset: 0, units: '' },
        8: { field: 'custom_wheelsize', type: 'uint16', scale: 1000, offset: 0, units: 'm' },
        9: { field: 'auto_wheelsize', type: 'uint16', scale: 1000, offset: 0, units: 'm' },
        10: { field: 'bike_weight', type: 'uint16', scale: 10, offset: 0, units: 'kg' },
        11: { field: 'power_cal_factor', type: 'uint16', scale: 10, offset: 0, units: '%' },
        12: { field: 'auto_wheel_cal', type: 'bool', scale: null, offset: 0, units: '' },
        13: { field: 'auto_power_zero', type: 'bool', scale: null, offset: 0, units: '' },
        14: { field: 'id', type: 'uint8', scale: null, offset: 0, units: '' },
        15: { field: 'spd_enabled', type: 'bool', scale: null, offset: 0, units: '' },
        16: { field: 'cad_enabled', type: 'bool', scale: null, offset: 0, units: '' },
        17: { field: 'spdcad_enabled', type: 'bool', scale: null, offset: 0, units: '' },
        18: { field: 'power_enabled', type: 'bool', scale: null, offset: 0, units: '' },
        19: { field: 'crank_length', type: 'uint8', scale: 2, offset: -110, units: 'mm' },
        20: { field: 'enabled', type: 'bool', scale: null, offset: 0, units: '' },
        21: { field: 'bike_spd_ant_id_trans_type', type: 'uint8z', scale: null, offset: 0, units: '' },
        22: { field: 'bike_cad_ant_id_trans_type', type: 'uint8z', scale: null, offset: 0, units: '' },
        23: { field: 'bike_spdcad_ant_id_trans_type', type: 'uint8z', scale: null, offset: 0, units: '' },
        24: { field: 'bike_power_ant_id_trans_type', type: 'uint8z', scale: null, offset: 0, units: '' },
        37: { field: 'odometer_rollover', type: 'uint8', scale: null, offset: 0, units: '' },
        38: { field: 'front_gear_num', type: 'uint8z', scale: null, offset: 0, units: '' },
        39: { field: 'front_gear', type: 'uint8z', scale: null, offset: 0, units: '' },
        40: { field: 'rear_gear_num', type: 'uint8z', scale: null, offset: 0, units: '' },
        41: { field: 'rear_gear', type: 'uint8z', scale: null, offset: 0, units: '' },
        44: { field: 'shimano_di2_enabled', type: 'bool', scale: null, offset: 0, units: '' },
    },
    7: {
        name: 'zones_target',
        1: { field: 'max_heart_rate', type: 'uint8', scale: null, offset: '', units: '' },
        2: { field: 'threshold_heart_rate', type: 'uint8', scale: null, offset: '', units: '' },
        3: { field: 'functional_threshold_power', type: 'uint16', scale: null, offset: '', units: '' },
        5: { field: 'hr_calc_type', type: 'hr_zone_calc', scale: null, offset: '', units: '' },
        7: { field: 'pwr_calc_type', type: 'pwr_zone_calc', scale: null, offset: '', units: '' },
    },
    8: {
        name: 'hr_zone',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: 0, units: '' },
        1: { field: 'high_bpm', type: 'uint8', scale: null, offset: 0, units: 'bpm' },
        2: { field: 'name', type: 'string', scale: null, offset: 0, units: '' },
    },
    9: {
        name: 'power_zone',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: 0, units: '' },
        1: { field: 'high_value', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        2: { field: 'name', type: 'string', scale: null, offset: 0, units: '' },
    },
    10: {
        name: 'met_zone',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: 0, units: '' },
        1: { field: 'high_bpm', type: 'uint8', scale: null, offset: 0, units: '' },
        2: { field: 'calories', type: 'uint16', scale: 10, offset: 0, units: 'kcal / min' },
        3: { field: 'fat_calories', type: 'uint8', scale: 10, offset: 0, units: 'kcal / min' },
    },
    12: {
        name: 'sport',
        0: { field: 'sport', type: 'sport', scale: null, offset: '', units: '' },
        1: { field: 'sub_sport', type: 'sub_sport', scale: null, offset: '', units: '' },
        3: { field: 'name', type: 'string', scale: null, offset: '', units: '' },
    },
    15: {
        name: 'goal',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: '', units: '' },
        0: { field: 'sport', type: 'sport', scale: null, offset: '', units: '' },
        1: { field: 'sub_sport', type: 'sub_sport', scale: null, offset: '', units: '' },
        2: { field: 'start_date', type: 'date_time', scale: null, offset: '', units: '' },
        3: { field: 'end_date', type: 'date_time', scale: null, offset: '', units: '' },
        4: { field: 'type', type: 'goal', scale: null, offset: '', units: '' },
        5: { field: 'value', type: 'uint32', scale: null, offset: '', units: '' },
        6: { field: 'repeat', type: 'bool', scale: null, offset: '', units: '' },
        7: { field: 'target_value', type: 'uint32', scale: null, offset: '', units: '' },
        8: { field: 'recurrence', type: 'goal_recurrence', scale: null, offset: '', units: '' },
        9: { field: 'recurrence_value', type: 'uint16', scale: null, offset: '', units: '' },
        10: { field: 'enabled', type: 'bool', scale: null, offset: '', units: '' },
    },
    18: {
        name: 'session',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: 0, units: '' },
        253: { field: 'timestamp', type: 'date_time', scale: null, offset: 0, units: 's' },
        0: { field: 'event', type: 'event', scale: null, offset: 0, units: '' },
        1: { field: 'event_type', type: 'event_type', scale: null, offset: 0, units: '' },
        2: { field: 'start_time', type: 'date_time', scale: null, offset: 0, units: '' },
        3: { field: 'start_position_lat', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        4: { field: 'start_position_long', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        5: { field: 'sport', type: 'sport', scale: null, offset: 0, units: '' },
        6: { field: 'sub_sport', type: 'sub_sport', scale: null, offset: 0, units: '' },
        7: { field: 'total_elapsed_time', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        8: { field: 'total_timer_time', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        9: { field: 'total_distance', type: 'uint32', scale: 100, offset: 0, units: 'm' },
        10: { field: 'total_cycles', type: 'uint32', scale: null, offset: 0, units: 'cycles' },
        11: { field: 'total_calories', type: 'uint16', scale: null, offset: 0, units: 'kcal' },
        13: { field: 'total_fat_calories', type: 'uint16', scale: null, offset: 0, units: 'kcal' },
        14: { field: 'avg_speed', type: 'uint16', scale: 1000, offset: 0, units: 'm/s' },
        15: { field: 'max_speed', type: 'uint16', scale: 1000, offset: 0, units: 'm/s' },
        16: { field: 'avg_heart_rate', type: 'uint8', scale: null, offset: 0, units: 'bpm' },
        17: { field: 'max_heart_rate', type: 'uint8', scale: null, offset: 0, units: 'bpm' },
        18: { field: 'avg_cadence', type: 'uint8', scale: null, offset: 0, units: 'rpm' },
        19: { field: 'max_cadence', type: 'uint8', scale: null, offset: 0, units: 'rpm' },
        20: { field: 'avg_power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        21: { field: 'max_power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        22: { field: 'total_ascent', type: 'uint16', scale: null, offset: 0, units: 'm' },
        23: { field: 'total_descent', type: 'uint16', scale: null, offset: 0, units: 'm' },
        24: { field: 'total_training_effect', type: 'uint8', scale: 10, offset: 0, units: '' },
        25: { field: 'first_lap_index', type: 'uint16', scale: null, offset: 0, units: '' },
        26: { field: 'num_laps', type: 'uint16', scale: null, offset: 0, units: '' },
        27: { field: 'event_group', type: 'uint8', scale: null, offset: 0, units: '' },
        28: { field: 'trigger', type: 'session_trigger', scale: null, offset: 0, units: '' },
        29: { field: 'nec_lat', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        30: { field: 'nec_long', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        31: { field: 'swc_lat', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        32: { field: 'swc_long', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        34: { field: 'normalized_power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        35: { field: 'training_stress_score', type: 'uint16', scale: 10, offset: 0, units: 'tss' },
        36: { field: 'intensity_factor', type: 'uint16', scale: 1000, offset: 0, units: 'if' },
        37: { field: 'left_right_balance', type: 'left_right_balance_100', scale: null, offset: 0, units: '' },
        41: { field: 'avg_stroke_count', type: 'uint32', scale: 10, offset: 0, units: 'strokes/lap' },
        42: { field: 'avg_stroke_distance', type: 'uint16', scale: 100, offset: 0, units: 'm' },
        43: { field: 'swim_stroke', type: 'swim_stroke', scale: null, offset: 0, units: 'swim_stroke' },
        44: { field: 'pool_length', type: 'uint16', scale: 100, offset: 0, units: 'm' },
        45: { field: 'threshold_power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        46: { field: 'pool_length_unit', type: 'display_measure', scale: null, offset: 0, units: '' },
        47: { field: 'num_active_lengths', type: 'uint16', scale: null, offset: 0, units: 'lengths' },
        48: { field: 'total_work', type: 'uint32', scale: null, offset: 0, units: 'J' },
        49: { field: 'avg_altitude', type: 'uint16', scale: 5, offset: 500, units: 'm' },
        50: { field: 'max_altitude', type: 'uint16', scale: 5, offset: 500, units: 'm' },
        51: { field: 'gps_accuracy', type: 'uint8', scale: null, offset: 0, units: 'm' },
        52: { field: 'avg_grade', type: 'sint16', scale: 100, offset: 0, units: '%' },
        53: { field: 'avg_pos_grade', type: 'sint16', scale: 100, offset: 0, units: '%' },
        54: { field: 'avg_neg_grade', type: 'sint16', scale: 100, offset: 0, units: '%' },
        55: { field: 'max_pos_grade', type: 'sint16', scale: 100, offset: 0, units: '%' },
        56: { field: 'max_neg_grade', type: 'sint16', scale: 100, offset: 0, units: '%' },
        57: { field: 'avg_temperature', type: 'sint8', scale: null, offset: 0, units: 'C' },
        58: { field: 'max_temperature', type: 'sint8', scale: null, offset: 0, units: 'C' },
        59: { field: 'total_moving_time', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        60: { field: 'avg_pos_vertical_speed', type: 'sint16', scale: 1000, offset: 0, units: 'm/s' },
        61: { field: 'avg_neg_vertical_speed', type: 'sint16', scale: 1000, offset: 0, units: 'm/s' },
        62: { field: 'max_pos_vertical_speed', type: 'sint16', scale: 1000, offset: 0, units: 'm/s' },
        63: { field: 'max_neg_vertical_speed', type: 'sint16', scale: 1000, offset: 0, units: 'm/s' },
        64: { field: 'min_heart_rate', type: 'uint8', scale: null, offset: 0, units: 'bpm' },
        65: { field: 'time_in_hr_zone', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        66: { field: 'time_in_speed_zone', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        67: { field: 'time_in_cadence_zone', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        68: { field: 'time_in_power_zone', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        69: { field: 'avg_lap_time', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        70: { field: 'best_lap_index', type: 'uint16', scale: null, offset: 0, units: '' },
        71: { field: 'min_altitude', type: 'uint16', scale: 5, offset: 500, units: 'm' },
        82: { field: 'player_score', type: 'uint16', scale: null, offset: 0, units: '' },
        83: { field: 'opponent_score', type: 'uint16', scale: null, offset: 0, units: '' },
        84: { field: 'opponent_name', type: 'string', scale: null, offset: 0, units: '' },
        85: { field: 'stroke_count', type: 'uint16', scale: null, offset: 0, units: 'counts' },
        86: { field: 'zone_count', type: 'uint16', scale: null, offset: 0, units: 'counts' },
        87: { field: 'max_ball_speed', type: 'uint16', scale: 100, offset: 0, units: 'm/s' },
        88: { field: 'avg_ball_speed', type: 'uint16', scale: 100, offset: 0, units: 'm/s' },
        89: { field: 'avg_vertical_oscillation', type: 'uint16', scale: 10, offset: 0, units: 'mm' },
        90: { field: 'avg_stance_time_percent', type: 'uint16', scale: 100, offset: 0, units: 'percent' },
        91: { field: 'avg_stance_time', type: 'uint16', scale: 10, offset: 0, units: 'ms' },
        92: { field: 'avg_fractional_cadence', type: 'uint8', scale: 128, offset: 0, units: 'rpm' },
        93: { field: 'max_fractional_cadence', type: 'uint8', scale: 128, offset: 0, units: 'rpm' },
        94: { field: 'total_fractional_cycles', type: 'uint8', scale: 128, offset: 0, units: 'cycles' },
        95: { field: 'avg_total_hemoglobin_conc', type: 'uint16', scale: 100, offset: 0, units: 'g/dL' },
        96: { field: 'min_total_hemoglobin_conc', type: 'uint16', scale: 100, offset: 0, units: 'g/dL' },
        97: { field: 'max_total_hemoglobin_conc', type: 'uint16', scale: 100, offset: 0, units: 'g/dL' },
        98: { field: 'avg_saturated_hemoglobin_percent', type: 'uint16', scale: 10, offset: 0, units: '%' },
        99: { field: 'min_saturated_hemoglobin_percent', type: 'uint16', scale: 10, offset: 0, units: '%' },
        100: { field: 'max_saturated_hemoglobin_percent', type: 'uint16', scale: 10, offset: 0, units: '%' },
        101: { field: 'avg_left_torque_effectiveness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        102: { field: 'avg_right_torque_effectiveness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        103: { field: 'avg_left_pedal_smoothness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        104: { field: 'avg_right_pedal_smoothness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        105: { field: 'avg_combined_pedal_smoothness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        111: { field: 'sport_index', type: 'uint8', scale: null, offset: 0, units: '' },
        112: { field: 'time_standing', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        113: { field: 'stand_count', type: 'uint16', scale: null, offset: 0, units: '' },
        114: { field: 'avg_left_pco', type: 'sint8', scale: null, offset: 0, units: 'mm' },
        115: { field: 'avg_right_pco', type: 'sint8', scale: null, offset: 0, units: 'mm' },
        116: { field: 'avg_left_power_phase', type: 'uint8', scale:  '0,7111111', offset: 0, units: 'degrees' },
        117: { field: 'avg_left_power_phase_peak', type: 'uint8', scale:  '0,7111111', offset: 0, units: 'degrees' },
        118: { field: 'avg_right_power_phase', type: 'uint8', scale:  '0,7111111', offset: 0, units: 'degrees' },
        119: { field: 'avg_right_power_phase_peak', type: 'uint8', scale:  '0,7111111', offset: 0, units: 'degrees' },
        120: { field: 'avg_power_position', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        121: { field: 'max_power_position', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        122: { field: 'avg_cadence_position', type: 'uint8', scale: null, offset: 0, units: 'rpm' },
        123: { field: 'max_cadence_position', type: 'uint8', scale: null, offset: 0, units: 'rpm' },
        124: { field: 'enhanced_avg_speed', type: 'uint32', scale: 1000, offset: 0, units: 'm/s' },
        125: { field: 'enhanced_max_speed', type: 'uint32', scale: 1000, offset: 0, units: 'm/s' },
        126: { field: 'enhanced_avg_altitude', type: 'uint32', scale: 5, offset: 500, units: 'm' },
        127: { field: 'enhanced_min_altitude', type: 'uint32', scale: 5, offset: 500, units: 'm' },
        128: { field: 'enhanced_max_altitude', type: 'uint32', scale: 5, offset: 500, units: 'm' },
        129: { field: 'avg_lev_motor_power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        130: { field: 'max_lev_motor_power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        131: { field: 'lev_battery_consumption', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
    },
    19: {
        name: 'lap',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: 0, units: '' },
        253: { field: 'timestamp', type: 'date_time', scale: null, offset: 0, units: 's' },
        0: { field: 'event', type: 'event', scale: null, offset: 0, units: '' },
        1: { field: 'event_type', type: 'event_type', scale: null, offset: 0, units: '' },
        2: { field: 'start_time', type: 'date_time', scale: null, offset: 0, units: '' },
        3: { field: 'start_position_lat', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        4: { field: 'start_position_long', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        5: { field: 'end_position_lat', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        6: { field: 'end_position_long', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        7: { field: 'total_elapsed_time', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        8: { field: 'total_timer_time', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        9: { field: 'total_distance', type: 'uint32', scale: 100, offset: 0, units: 'm' },
        10: { field: 'total_cycles', type: 'uint32', scale: null, offset: 0, units: 'cycles' },
        11: { field: 'total_calories', type: 'uint16', scale: null, offset: 0, units: 'kcal' },
        12: { field: 'total_fat_calories', type: 'uint16', scale: null, offset: 0, units: 'kcal' },
        13: { field: 'avg_speed', type: 'uint16', scale: 1000, offset: 0, units: 'm/s' },
        14: { field: 'max_speed', type: 'uint16', scale: 1000, offset: 0, units: 'm/s' },
        15: { field: 'avg_heart_rate', type: 'uint8', scale: null, offset: 0, units: 'bpm' },
        16: { field: 'max_heart_rate', type: 'uint8', scale: null, offset: 0, units: 'bpm' },
        17: { field: 'avg_cadence', type: 'uint8', scale: null, offset: 0, units: 'rpm' },
        18: { field: 'max_cadence', type: 'uint8', scale: null, offset: 0, units: 'rpm' },
        19: { field: 'avg_power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        20: { field: 'max_power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        21: { field: 'total_ascent', type: 'uint16', scale: null, offset: 0, units: 'm' },
        22: { field: 'total_descent', type: 'uint16', scale: null, offset: 0, units: 'm' },
        23: { field: 'intensity', type: 'intensity', scale: null, offset: 0, units: '' },
        24: { field: 'lap_trigger', type: 'lap_trigger', scale: null, offset: 0, units: '' },
        25: { field: 'sport', type: 'sport', scale: null, offset: 0, units: '' },
        26: { field: 'event_group', type: 'uint8', scale: null, offset: 0, units: '' },
        32: { field: 'num_lengths', type: 'uint16', scale: null, offset: 0, units: 'lengths' },
        33: { field: 'normalized_power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        34: { field: 'left_right_balance', type: 'left_right_balance_100', scale: null, offset: 0, units: '' },
        35: { field: 'first_length_index', type: 'uint16', scale: null, offset: 0, units: '' },
        37: { field: 'avg_stroke_distance', type: 'uint16', scale: 100, offset: 0, units: 'm' },
        38: { field: 'swim_stroke', type: 'swim_stroke', scale: null, offset: 0, units: '' },
        39: { field: 'sub_sport', type: 'sub_sport', scale: null, offset: 0, units: '' },
        40: { field: 'num_active_lengths', type: 'uint16', scale: null, offset: 0, units: 'lengths' },
        41: { field: 'total_work', type: 'uint32', scale: null, offset: 0, units: 'J' },
        42: { field: 'avg_altitude', type: 'uint16', scale: 5, offset: 500, units: 'm' },
        43: { field: 'max_altitude', type: 'uint16', scale: 5, offset: 500, units: 'm' },
        44: { field: 'gps_accuracy', type: 'uint8', scale: null, offset: 0, units: 'm' },
        45: { field: 'avg_grade', type: 'sint16', scale: 100, offset: 0, units: '%' },
        46: { field: 'avg_pos_grade', type: 'sint16', scale: 100, offset: 0, units: '%' },
        47: { field: 'avg_neg_grade', type: 'sint16', scale: 100, offset: 0, units: '%' },
        48: { field: 'max_pos_grade', type: 'sint16', scale: 100, offset: 0, units: '%' },
        49: { field: 'max_neg_grade', type: 'sint16', scale: 100, offset: 0, units: '%' },
        50: { field: 'avg_temperature', type: 'sint8', scale: null, offset: 0, units: 'C' },
        51: { field: 'max_temperature', type: 'sint8', scale: null, offset: 0, units: 'C' },
        52: { field: 'total_moving_time', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        53: { field: 'avg_pos_vertical_speed', type: 'sint16', scale: 1000, offset: 0, units: 'm/s' },
        54: { field: 'avg_neg_vertical_speed', type: 'sint16', scale: 1000, offset: 0, units: 'm/s' },
        55: { field: 'max_pos_vertical_speed', type: 'sint16', scale: 1000, offset: 0, units: 'm/s' },
        56: { field: 'max_neg_vertical_speed', type: 'sint16', scale: 1000, offset: 0, units: 'm/s' },
        57: { field: 'time_in_hr_zone', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        58: { field: 'time_in_speed_zone', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        59: { field: 'time_in_cadence_zone', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        60: { field: 'time_in_power_zone', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        61: { field: 'repetition_num', type: 'uint16', scale: null, offset: 0, units: '' },
        62: { field: 'min_altitude', type: 'uint16', scale: 5, offset: 500, units: 'm' },
        63: { field: 'min_heart_rate', type: 'uint8', scale: null, offset: 0, units: 'bpm' },
        71: { field: 'wkt_step_index', type: 'message_index', scale: null, offset: 0, units: '' },
        74: { field: 'opponent_score', type: 'uint16', scale: null, offset: 0, units: '' },
        75: { field: 'stroke_count', type: 'uint16', scale: null, offset: 0, units: 'counts' },
        76: { field: 'zone_count', type: 'uint16', scale: null, offset: 0, units: 'counts' },
        77: { field: 'avg_vertical_oscillation', type: 'uint16', scale: 10, offset: 0, units: 'mm' },
        78: { field: 'avg_stance_time_percent', type: 'uint16', scale: 100, offset: 0, units: 'percent' },
        79: { field: 'avg_stance_time', type: 'uint16', scale: 10, offset: 0, units: 'ms' },
        80: { field: 'avg_fractional_cadence', type: 'uint8', scale: 128, offset: 0, units: 'rpm' },
        81: { field: 'max_fractional_cadence', type: 'uint8', scale: 128, offset: 0, units: 'rpm' },
        82: { field: 'total_fractional_cycles', type: 'uint8', scale: 128, offset: 0, units: 'cycles' },
        83: { field: 'player_score', type: 'uint16', scale: null, offset: 0, units: '' },
        84: { field: 'avg_total_hemoglobin_conc', type: 'uint16', scale: 100, offset: 0, units: 'g/dL' },
        85: { field: 'min_total_hemoglobin_conc', type: 'uint16', scale: 100, offset: 0, units: 'g/dL' },
        86: { field: 'max_total_hemoglobin_conc', type: 'uint16', scale: 100, offset: 0, units: 'g/dL' },
        87: { field: 'avg_saturated_hemoglobin_percent', type: 'uint16', scale: 10, offset: 0, units: '%' },
        88: { field: 'min_saturated_hemoglobin_percent', type: 'uint16', scale: 10, offset: 0, units: '%' },
        89: { field: 'max_saturated_hemoglobin_percent', type: 'uint16', scale: 10, offset: 0, units: '%' },
        91: { field: 'avg_left_torque_effectiveness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        92: { field: 'avg_right_torque_effectiveness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        93: { field: 'avg_left_pedal_smoothness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        94: { field: 'avg_right_pedal_smoothness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        95: { field: 'avg_combined_pedal_smoothness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        98: { field: 'time_standing', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        99: { field: 'stand_count', type: 'uint16', scale: null, offset: 0, units: '' },
        100: { field: 'avg_left_pco', type: 'sint8', scale: null, offset: 0, units: 'mm' },
        101: { field: 'avg_right_pco', type: 'sint8', scale: null, offset: 0, units: 'mm' },
        102: { field: 'avg_left_power_phase', type: 'uint8', scale:  '0,7111111', offset: 0, units: 'degrees' },
        103: { field: 'avg_left_power_phase_peak', type: 'uint8', scale:  '0,7111111', offset: 0, units: 'degrees' },
        104: { field: 'avg_right_power_phase', type: 'uint8', scale:  '0,7111111', offset: 0, units: 'degrees' },
        105: { field: 'avg_right_power_phase_peak', type: 'uint8', scale:  '0,7111111', offset: 0, units: 'degrees' },
        106: { field: 'avg_power_position', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        107: { field: 'max_power_position', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        108: { field: 'avg_cadence_position', type: 'uint8', scale: null, offset: 0, units: 'rpm' },
        109: { field: 'max_cadence_position', type: 'uint8', scale: null, offset: 0, units: 'rpm' },
        110: { field: 'enhanced_avg_speed', type: 'uint32', scale: 1000, offset: 0, units: 'm/s' },
        111: { field: 'enhanced_max_speed', type: 'uint32', scale: 1000, offset: 0, units: 'm/s' },
        112: { field: 'enhanced_avg_altitude', type: 'uint32', scale: 5, offset: 500, units: 'm' },
        113: { field: 'enhanced_min_altitude', type: 'uint32', scale: 5, offset: 500, units: 'm' },
        114: { field: 'enhanced_max_altitude', type: 'uint32', scale: 5, offset: 500, units: 'm' },
        115: { field: 'avg_lev_motor_power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        116: { field: 'max_lev_motor_power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        117: { field: 'lev_battery_consumption', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
    },
    20: {
        name: 'record',
        253: { field: 'timestamp', type: 'date_time', scale: null, offset: 0, units: 's' },
        0: { field: 'position_lat', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        1: { field: 'position_long', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        2: { field: 'altitude', type: 'uint16', scale: 5, offset: 500, units: 'm' },
        3: { field: 'heart_rate', type: 'uint8', scale: null, offset: 0, units: 'bpm' },
        4: { field: 'cadence', type: 'uint8', scale: null, offset: 0, units: 'rpm' },
        5: { field: 'distance', type: 'uint32', scale: 100, offset: 0, units: 'm' },
        6: { field: 'speed', type: 'uint16', scale: 1000, offset: 0, units: 'm/s' },
        7: { field: 'power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        8: { field: 'compressed_speed_distance', type: 'byte', scale: '100,16', offset: 0, units: 'm/s,m' },
        9: { field: 'grade', type: 'sint16', scale: 100, offset: 0, units: '%' },
        10: { field: 'resistance', type: 'uint8', scale: null, offset: 0, units: '' },
        11: { field: 'time_from_course', type: 'sint32', scale: 1000, offset: 0, units: 's' },
        12: { field: 'cycle_length', type: 'uint8', scale: 100, offset: 0, units: 'm' },
        13: { field: 'temperature', type: 'sint8', scale: null, offset: 0, units: 'C' },
        17: { field: 'speed_1s', type: 'uint8', scale: 16, offset: 0, units: 'm/s' },
        18: { field: 'cycles', type: 'uint8', scale: null, offset: 0, units: 'cycles' },
        19: { field: 'total_cycles', type: 'uint32', scale: null, offset: 0, units: 'cycles' },
        28: { field: 'compressed_accumulated_power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
        29: { field: 'accumulated_power', type: 'uint32', scale: null, offset: 0, units: 'watts' },
        30: { field: 'left_right_balance', type: 'left_right_balance', scale: null, offset: 0, units: '' },
        31: { field: 'gps_accuracy', type: 'uint8', scale: null, offset: 0, units: 'm' },
        32: { field: 'vertical_speed', type: 'sint16', scale: 1000, offset: 0, units: 'm/s' },
        33: { field: 'calories', type: 'uint16', scale: null, offset: 0, units: 'kcal' },
        39: { field: 'vertical_oscillation', type: 'uint16', scale: 10, offset: 0, units: 'mm' },
        40: { field: 'stance_time_percent', type: 'uint16', scale: 100, offset: 0, units: 'percent' },
        41: { field: 'stance_time', type: 'uint16', scale: 10, offset: 0, units: 'ms' },
        42: { field: 'activity_type', type: 'activity_type', scale: null, offset: 0, units: '' },
        43: { field: 'left_torque_effectiveness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        44: { field: 'right_torque_effectiveness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        45: { field: 'left_pedal_smoothness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        46: { field: 'right_pedal_smoothness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        47: { field: 'combined_pedal_smoothness', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        48: { field: 'time128', type: 'uint8', scale: 128, offset: 0, units: 's' },
        49: { field: 'stroke_type', type: 'stroke_type', scale: null, offset: 0, units: '' },
        50: { field: 'zone', type: 'uint8', scale: null, offset: 0, units: '' },
        51: { field: 'ball_speed', type: 'uint16', scale: 100, offset: 0, units: 'm/s' },
        52: { field: 'cadence256', type: 'uint16', scale: 256, offset: 0, units: 'rpm' },
        53: { field: 'fractional_cadence', type: 'uint8', scale: 128, offset: 0, units: 'rpm' },
        54: { field: 'total_hemoglobin_conc', type: 'uint16', scale: 100, offset: 0, units: 'g/dL' },
        55: { field: 'total_hemoglobin_conc_min', type: 'uint16', scale: 100, offset: 0, units: 'g/dL' },
        56: { field: 'total_hemoglobin_conc_max', type: 'uint16', scale: 100, offset: 0, units: 'g/dL' },
        57: { field: 'saturated_hemoglobin_percent', type: 'uint16', scale: 10, offset: 0, units: '%' },
        58: { field: 'saturated_hemoglobin_percent_min', type: 'uint16', scale: 10, offset: 0, units: '%' },
        59: { field: 'saturated_hemoglobin_percent_max', type: 'uint16', scale: 10, offset: 0, units: '%' },
        62: { field: 'device_index', type: 'device_index', scale: null, offset: 0, units: '' },
        67: { field: 'left_pco', type: 'sint8', scale: null, offset: 0, units: 'mm' },
        68: { field: 'right_pco', type: 'sint8', scale: null, offset: 0, units: 'mm' },
        69: { field: 'left_power_phase', type: 'uint8', scale:  '0,7111111', offset: 0, units: 'degrees' },
        70: { field: 'left_power_phase_peak', type: 'uint8', scale:  '0,7111111', offset: 0, units: 'degrees' },
        71: { field: 'right_power_phase', type: 'uint8', scale:  '0,7111111', offset: 0, units: 'degrees' },
        72: { field: 'right_power_phase_peak', type: 'uint8', scale:  '0,7111111', offset: 0, units: 'degrees' },
        73: { field: 'enhanced_speed', type: 'uint32', scale: 1000, offset: 0, units: 'm/s' },
        78: { field: 'enhanced_altitude', type: 'uint32', scale: 5, offset: 500, units: 'm' },
        81: { field: 'battery_soc', type: 'uint8', scale: 2, offset: 0, units: 'percent' },
        82: { field: 'motor_power', type: 'uint16', scale: null, offset: 0, units: 'watts' },
    },
    21: {
        name: 'event',
        253: { field: 'timestamp', type: 'date_time', scale: null, offset: '', units: 's' },
        0: { field: 'event', type: 'event', scale: null, offset: '', units: '' },
        1: { field: 'event_type', type: 'event_type', scale: null, offset: '', units: '' },
        2: { field: 'data16', type: 'uint16', scale: null, offset: '', units: '' },
        3: { field: 'data', type: 'uint32', scale: null, offset: '', units: '' },
        4: { field: 'event_group', type: 'uint8', scale: null, offset: '', units: '' },
        7: { field: 'score', type: 'uint16', scale: null, offset: '', units: '' },
        8: { field: 'opponent_score', type: 'uint16', scale: null, offset: '', units: '' },
        9: { field: 'front_gear_num', type: 'uint8z', scale: null, offset: '', units: '' },
        10: { field: 'front_gear', type: 'uint8z', scale: null, offset: '', units: '' },
        11: { field: 'rear_gear_num', type: 'uint8z', scale: null, offset: '', units: '' },
        12: { field: 'rear_gear', type: 'uint8z', scale: null, offset: '', units: '' },
        13: { field: 'device_index', type: 'device_index', scale: null, offset: '', units: '' },
    },
    23: {
        name: 'device_info',
        253: { field: 'timestamp', type: 'date_time', scale: null, offset: 0, units: 's' },
        0: { field: 'device_index', type: 'device_index', scale: null, offset: 0, units: '' },
        1: { field: 'device_type', type: 'uint8', scale: null, offset: 0, units: '' },
        2: { field: 'manufacturer', type: 'manufacturer', scale: null, offset: 0, units: '' },
        3: { field: 'serial_number', type: 'uint32z', scale: null, offset: 0, units: '' },
        4: { field: 'product', type: 'uint16', scale: null, offset: 0, units: '' },
        5: { field: 'software_version', type: 'uint16', scale: 100, offset: 0, units: '' },
        6: { field: 'hardware_version', type: 'uint8', scale: null, offset: 0, units: '' },
        7: { field: 'cum_operating_time', type: 'uint32', scale: null, offset: 0, units: 's' },
        10: { field: 'battery_voltage', type: 'uint16', scale: 256, offset: 0, units: 'V' },
        11: { field: 'battery_status', type: 'battery_status', scale: null, offset: 0, units: '' },
        18: { field: 'sensor_position', type: 'body_location', scale: null, offset: 0, units: '' },
        19: { field: 'descriptor', type: 'string', scale: null, offset: 0, units: '' },
        20: { field: 'ant_transmission_type', type: 'uint8z', scale: null, offset: 0, units: '' },
        21: { field: 'ant_device_number', type: 'uint16z', scale: null, offset: 0, units: '' },
        22: { field: 'ant_network', type: 'ant_network', scale: null, offset: 0, units: '' },
        25: { field: 'source_type', type: 'source_type', scale: null, offset: 0, units: '' },
        27: { field: 'product_name', type: 'string', scale: null, offset: 0, units: '' },
    },
    26: {
        name: 'workout',
        4: { field: 'sport', type: 'sport', scale: null, offset: '', units: '' },
        5: { field: 'capabilities', type: 'workout_capabilities', scale: null, offset: '', units: '' },
        6: { field: 'num_valid_steps', type: 'uint16', scale: null, offset: '', units: '' },
        8: { field: 'wkt_name', type: 'string', scale: null, offset: '', units: '' },
    },
    27: {
        name: 'workout_step',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: 0, units: '' },
        0: { field: 'wkt_step_name', type: 'string', scale: null, offset: 0, units: '' },
        1: { field: 'duration_type', type: 'wkt_step_duration', scale: null, offset: 0, units: '' },
        2: { field: 'duration_value', type: 'uint32', scale: null, offset: 0, units: '' },
        3: { field: 'target_type', type: 'wkt_step_target', scale: null, offset: 0, units: '' },
        4: { field: 'target_value', type: 'uint32', scale: null, offset: 0, units: '' },
        5: { field: 'custom_target_value_low', type: 'uint32', scale: null, offset: 0, units: '' },
        6: { field: 'custom_target_value_high', type: 'uint32', scale: null, offset: 0, units: '' },
        7: { field: 'intensity', type: 'intensity', scale: null, offset: 0, units: '' },
    },
    30: {
        name: 'weight_scale',
        253: { field: 'timestamp', type: 'date_time', scale: null, offset: 0, units: 's' },
        0: { field: 'weight', type: 'weight', scale: 100, offset: 0, units: 'kg' },
        1: { field: 'percent_fat', type: 'uint16', scale: 100, offset: 0, units: '%' },
        2: { field: 'percent_hydration', type: 'uint16', scale: 100, offset: 0, units: '%' },
        3: { field: 'visceral_fat_mass', type: 'uint16', scale: 100, offset: 0, units: 'kg' },
        4: { field: 'bone_mass', type: 'uint16', scale: 100, offset: 0, units: 'kg' },
        5: { field: 'muscle_mass', type: 'uint16', scale: 100, offset: 0, units: 'kg' },
        7: { field: 'basal_met', type: 'uint16', scale: 4, offset: 0, units: 'kcal/day' },
        8: { field: 'physique_rating', type: 'uint8', scale: null, offset: 0, units: '' },
        9: { field: 'active_met', type: 'uint16', scale: 4, offset: 0, units: 'kcal/day' },
        10: { field: 'metabolic_age', type: 'uint8', scale: null, offset: 0, units: 'years' },
        11: { field: 'visceral_fat_rating', type: 'uint8', scale: null, offset: 0, units: '' },
        12: { field: 'user_profile_index', type: 'message_index', scale: null, offset: 0, units: '' },
    },
    31: {
        name: 'course',
        4: { field: 'sport', type: 'sport', scale: null, offset: '', units: '' },
        5: { field: 'name', type: 'string', scale: null, offset: '', units: '' },
        6: { field: 'capabilities', type: 'course_capabilities', scale: null, offset: '', units: '' },
    },
    32: {
        name: 'course_point',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: 0, units: '' },
        1: { field: 'timestamp', type: 'date_time', scale: null, offset: 0, units: '' },
        2: { field: 'position_lat', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        3: { field: 'position_long', type: 'sint32', scale: null, offset: 0, units: 'semicircles' },
        4: { field: 'distance', type: 'uint32', scale: 100, offset: 0, units: 'm' },
        5: { field: 'type', type: 'course_point', scale: null, offset: 0, units: '' },
        6: { field: 'name', type: 'string', scale: null, offset: 0, units: '' },
        8: { field: 'favorite', type: 'bool', scale: null, offset: 0, units: '' },
    },
    33: {
        name: 'totals',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: 0, units: '' },
        253: { field: 'timestamp', type: 'date_time', scale: null, offset: 0, units: 's' },
        0: { field: 'timer_time', type: 'uint32', scale: null, offset: 0, units: 's' },
        1: { field: 'distance', type: 'uint32', scale: null, offset: 0, units: 'm' },
        2: { field: 'calories', type: 'uint32', scale: null, offset: 0, units: 'kcal' },
        3: { field: 'sport', type: 'sport', scale: null, offset: 0, units: '' },
        4: { field: 'elapsed_time', type: 'uint32', scale: null, offset: 0, units: 's' },
        5: { field: 'sessions', type: 'uint16', scale: null, offset: 0, units: '' },
        6: { field: 'active_time', type: 'uint32', scale: null, offset: 0, units: 's' },
        9: { field: 'sport_index', type: 'uint8', scale: null, offset: 0, units: '' },
    },
    34: {
        name: 'activity',
        253: { field: 'timestamp', type: 'date_time', scale: null, offset: 0, units: '' },
        0: { field: 'total_timer_time', type: 'uint32', scale: 1000, offset: 0, units: 's' },
        1: { field: 'num_sessions', type: 'uint16', scale: null, offset: 0, units: '' },
        2: { field: 'type', type: 'activity', scale: null, offset: 0, units: '' },
        3: { field: 'event', type: 'event', scale: null, offset: 0, units: '' },
        4: { field: 'event_type', type: 'event_type', scale: null, offset: 0, units: '' },
        5: { field: 'local_timestamp', type: 'local_date_time', scale: null, offset: 0, units: '' },
        6: { field: 'event_group', type: 'uint8', scale: null, offset: 0, units: '' },
    },
    35: {
        name: 'software',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: '', units: '' },
        3: { field: 'version', type: 'uint16', scale: 100, offset: '', units: '' },
        5: { field: 'part_number', type: 'string', scale: null, offset: '', units: '' },
    },
    37: {
        name: 'file_capabilities',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: 0, units: '' },
        0: { field: 'type', type: 'file', scale: null, offset: 0, units: '' },
        1: { field: 'flags', type: 'file_flags', scale: null, offset: 0, units: '' },
        2: { field: 'directory', type: 'string', scale: null, offset: 0, units: '' },
        3: { field: 'max_count', type: 'uint16', scale: null, offset: 0, units: '' },
        4: { field: 'max_size', type: 'uint32', scale: null, offset: 0, units: 'bytes' },
    },
    38: {
        name: 'mesg_capabilities',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: '', units: '' },
        0: { field: 'file', type: 'file', scale: null, offset: '', units: '' },
        1: { field: 'mesg_num', type: 'mesg_num', scale: null, offset: '', units: '' },
        2: { field: 'count_type', type: 'mesg_count', scale: null, offset: '', units: '' },
        3: { field: 'count', type: 'uint16', scale: null, offset: '', units: '' },
    },
    39: {
        name: 'field_capabilities',
        254: { field: 'message_index', type: 'message_index', scale: null, offset: '', units: '' },
        0: { field: 'file', type: 'file', scale: null, offset: '', units: '' },
        1: { field: 'mesg_num', type: 'mesg_num', scale: null, offset: '', units: '' },
        2: { field: 'field_num', type: 'uint8', scale: null, offset: '', units: '' },
        3: { field: 'count', type: 'uint16', scale: null, offset: '', units: '' },
    },
    49: {
        name: 'file_creator',
        0: { field: 'software_version', type: 'uint16', scale: null, offset: '', units: '' },
        1: { field: 'hardware_version', type: 'uint8', scale: null, offset: '', units: '' },
    },
    51: {
        name: 'blood_pressure',
        253: { field: 'timestamp', type: 'date_time', scale: null, offset: 0, units: 's' },
        0: { field: 'systolic_pressure', type: 'uint16', scale: null, offset: 0, units: 'mmHg' },
        1: { field: 'diastolic_pressure', type: 'uint16', scale: null, offset: 0, units: 'mmHg' },
        2: { field: 'mean_arterial_pressure', type: 'uint16', scale: null, offset: 0, units: 'mmHg' },
        3: { field: 'map_3_sample_mean', type: 'uint16', scale: null, offset: 0, units: 'mmHg' },
        4: { field: 'map_morning_values', type: 'uint16', scale: null, offset: 0, units: 'mmHg' },
        5: { field: 'map_evening_values', type: 'uint16', scale: null, offset: 0, units: 'mmHg' },
        6: { field: 'heart_rate', type: 'uint8', scale: null, offset: 0, units: 'bpm' },
        7: { field: 'heart_rate_type', type: 'hr_type', scale: null, offset: 0, units: '' },
        8: { field: 'status', type: 'bp_status', scale: null, offset: 0, units: '' },
        9: { field: 'user_profile_index', type: 'message_index', scale: null, offset: 0, units: '' },
    },
});
