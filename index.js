"use strict";

/**
 * Helper class to create a drop target for binary files.
 */
class DropTarget {

    /**
     * @param {Node} element
     * @param {Function} callback
     */
    static apply(element, callback) {
        element.addEventListener('dragover', DropTarget.prevent.bind(null));
        element.addEventListener('dragenter', DropTarget.prevent.bind(null));
        element.addEventListener('drop', /** @type {{dataTransfer:DataTransfer}} */ e => {
            DropTarget.prevent(e);
            if (e.dataTransfer.files.length > 0) {
                const fileInfo = e.dataTransfer.files[0];
                const reader = new FileReader();
                reader.addEventListener('load', re => callback(re.target.result));
                reader.readAsArrayBuffer(fileInfo);
            }
        });
    }

    static prevent(e) {
        e.stopPropagation();
        e.preventDefault();
    }
}

/**
 * Helper class to asynchronously load binary files.
 */
class FileLoader {

    /**
     * @param {string} fileName
     * @return {Promise<ArrayBuffer>}
     */
    static async load(fileName) {
        return new Promise((resolve) => {
            const client = new XMLHttpRequest();
            client.open('GET', fileName, true);
            client.responseType = 'arraybuffer';
            client.addEventListener('readystatechange', () => {
                if (client.readyState === XMLHttpRequest.DONE) {
                    resolve(client.response);
                }
            });
            client.send();
        });
    }
}

/**
 * Helper class to read binary data.
 */
class DataReader {

    /**
     * @param {DataView} dataView
     */
    constructor (dataView) {
        this.dataView = dataView;
        this.position = 0;
        this.isLittleEndian = true;
    }

    getPosition() {
        return this.position;
    }

    skip(lengthInBytes) {
        this.position += lengthInBytes;
    }

    read(object, fields) {
        for (const fieldName of Object.keys(fields)) {
            const fieldType = fields[fieldName];
            switch (fieldType.charAt(0)) {
                case 'B':
                    object[fieldName] = this.readUint8();
                    break;
                case 'W':
                    object[fieldName] = this.readUint16();
                    break;
                case 'D':
                    object[fieldName] = this.readUint32();
                    break;
                case 'S':
                    const stringLength = fieldType.length > 1 ? parseInt(fieldType.substr(1)) : 1;
                    object[fieldName] = this.readString(stringLength);
                    // console.info(fieldName, fieldType, object[fieldName]);
                    break;
            }
        }
    }

    /**
     * Reads a byte, bit by bit, according to the recipe in `fields`. `fields` is an object in which each property maps
     * to a property in `object` where the corresponding value will be written, and each value maps to the number of
     * bits to read for that property. For instance, given the following byte:
     *
     *     11111001
     *
     * The call:
     *
     *     const myObject = {};
     *     readByteBits(myObject, {foo: 2, bar: 3, fizz: 3});
     *
     * Will produce:
     *
     *     myObject === {foo: 3, bar: 7, fizz: 1}
     *
     * As you can see, bits are read from the most significant to the least significant one.
     *
     * @param {Object} object
     * @param {Object} fields
     */
    readByteBits(object, fields) {
        const byte = this.readUint8();
        let bitPosition = 8;

        for (const fieldName of Object.keys(fields)) {
            const bitLength = fields[fieldName];

            if (bitPosition - bitLength < 0) {
                throw new Error('Bit slice requested is out of bounds ' +
                    `(bitPosition=${bitPosition}, bitLength=${bitLength})`);
            }

            const mask = ((1 << bitLength) - 1) << (bitPosition - bitLength);
            object[fieldName] = (byte & mask) >>> (bitPosition - bitLength);
            bitPosition -= bitLength;
        }
    }

    readUint8() {
        const result = this.dataView.getUint8(this.position);
        this.position++;
        return result;
    }

    readUint16() {
        const result = this.dataView.getUint16(this.position, this.isLittleEndian);
        this.position += 2;
        return result;
    }

    readUint32() {
        const result = this.dataView.getUint32(this.position, this.isLittleEndian);
        this.position += 4;
        return result;
    }

    readString(length) {
        const bufferSlice = this.dataView.buffer.slice(this.position, this.position + length);
        this.position += length;
        return String.fromCharCode(...new Uint8Array(bufferSlice));
    }
}

/**
 * Helper class to parse FIT files.
 */
class FitParser {

    /**
     * @param {DataReader} dataReader
     */
    constructor (dataReader) {
        this.dataReader = dataReader;
        this.header = {};

        this.dataReader.read(this.header, {
            size: 'B', protocolVersion: 'B', profileVersion: 'W', dataSize: 'D', magic: 'S4'
        });

        if (this.header.size === 14) {
            this.dataReader.read(this.header, { crc: 'W' });
        }

        const records = [];
        while (this.dataReader.getPosition() < this.header.size + this.header.dataSize) {
            records.push(this.readRecord());
        }

        const bytesLeft = (this.length() - this.dataReader.getPosition());

        if (bytesLeft === 2) {
            this.dataReader.read(this.header, { crc2: 'W' });
        } else if (bytesLeft !== 0) {
            throw new Error('Unexpected number of bytes left: ' + bytesLeft);
        }

        console.info('File Header', this.header);
        console.info('Total records: ' + records.length);
    }

    readRecord() {
        const recordHeader = this.readRecordHeader();
        let recordContent;

        if (recordHeader.headerType === 0) {  // normal header
            if (recordHeader.messageType === 1) {  // definition message
                recordContent = this.readDefinitionMessage(recordHeader);
            } else {  // data message
                recordContent = this.readDataMessage(recordHeader);
            }
        } else {  // compressed header
            throw new Error('Found compressed header');
        }

        return { header: recordHeader, content: recordContent };
        // console.info(`${recordType} Record`, recordHeader, recordContent);
    }

    readRecordHeader() {
        const recordHeader = {};
        this.dataReader.readByteBits(recordHeader,
            { headerType: 1, messageType: 1, messageTypeSpecific: 1, reserved: 1, localMessageType: 4 });
        return recordHeader;
    }

    readDefinitionMessage(recordHeader) {
        const recordContent = {};

        this.recordPayloadSize = 0;

        this.dataReader.read(recordContent,
            { reserved: 'B', architecture: 'B', globalMessageNumber: 'W', numberOfFields: 'B'});

        // field definitions
        recordContent.fields = [];
        for (let fi = 0; fi < recordContent.numberOfFields; fi++) {
            const field = {};
            recordContent.fields.push(field);
            this.dataReader.read(field, {fieldDefinitionNumber: 'B', size: 'B', baseType: 'B'});
        }

        this.recordPayloadSize += recordContent.fields
            .map(field => field.size).reduce((acc, val) => acc + val, 0);

        // developer field definitions
        if (recordHeader.messageTypeSpecific === 1) {  // has developer data
            this.dataReader.read(recordContent, { developerNumberOfFields: 'B'});

            recordContent.developerFields = [];
            for (let fi = 0; fi < recordContent.developerNumberOfFields; fi++) {
                const field = {};
                recordContent.developerFields.push(field);
                this.dataReader.read(field, {fieldNumber: 'B', size: 'B', developerDataIndex: 'B'});
            }

            this.recordPayloadSize += recordContent.developerFields
                .map(field => field.size).reduce((acc, val) => acc + val, 0);
        }

        return recordContent;
    }

    readDataMessage(recordHeader) {
        const recordContent = {};
        if (recordHeader.messageTypeSpecific === 1) {
            throw new Error('messageTypeSpecific field should not be 1 for data messages');
        }

        this.dataReader.skip(this.recordPayloadSize);
        return recordContent;
    }

    length() {
        return this.dataReader.dataView.byteLength;
    }
}

/**
 * Main app class.
 */
class FitApp {

    constructor () {
        this.fit = null;
    }

    /**
     * Initialize async stuff that can't be in the constructor.
     * @return {void}
     */
    async initialize() {
        // Screens
        await this.initializeScreens();

        // Drop target screen bindings
        this.loadSampleButton = document.getElementById('load-sample-button');
        this.loadSampleButton.addEventListener('click', () => this.onSampleButtonClick());
        DropTarget.apply(this.dropTargetScreen, async (buffer) => await this.processFitFile(buffer));
    }

    async onSampleButtonClick() {
        const buffer = await FileLoader.load(FitApp.SAMPLE_FIT_FILE_NAME);
        await this.processFitFile(buffer);
    }

    async initializeScreens() {
        this.dropTargetScreen = document.getElementById(FitApp.SCREEN_DROP);
        this.loadingScreen = document.getElementById(FitApp.SCREEN_LOADING);
        this.mainScreen = document.getElementById(FitApp.SCREEN_MAIN);

        /** @type {Map<string, Node>} */
        this.screenByName = new Map();
        this.screenByName.set(FitApp.SCREEN_DROP, this.dropTargetScreen);
        this.screenByName.set(FitApp.SCREEN_LOADING, this.loadingScreen);
        this.screenByName.set(FitApp.SCREEN_MAIN, this.mainScreen);

        for (const screen of this.screenByName.values()) {
            screen.classList.add('hidden');
        }

        this.activeScreenId = null;
        await this.switchScreen(FitApp.SCREEN_DROP);
    }

    /**
     * Little hack to give some time for the browser to take care of refreshing the screen amid intensive CPU activity.
     * @return {Promise<void>}
     */
    async forceRefresh() {
        return new Promise(resolve => setTimeout(resolve, 10));
    }

    /**
     * @param {string} screenId - the id of the screen to switch to
     * @return {Promise<void>}
     */
    async switchScreen(screenId) {
        this.screenByName.get(screenId).classList.remove('hidden');
        if (this.activeScreenId !== null) {
            this.screenByName.get(this.activeScreenId).classList.add('hidden');
        }
        this.activeScreenId = screenId;
        await this.forceRefresh();
    }

    /**
     * @param {ArrayBuffer} buffer
     */
    async processFitFile(buffer) {
        await this.switchScreen(FitApp.SCREEN_LOADING);

        const dataView = new DataView(buffer);
        const dataReader = new DataReader(dataView);
        this.fit = new FitParser(dataReader);

        await this.switchScreen(FitApp.SCREEN_MAIN);
    }
}

FitApp.SAMPLE_FIT_FILE_NAME = 'sample/lax-ventura.fit';
FitApp.SCREEN_DROP = 'drop-target-screen';
FitApp.SCREEN_LOADING = 'loading-screen';
FitApp.SCREEN_MAIN = 'main-screen';

// since the script is deferred, this will only run after the page is loaded
(new FitApp()).initialize();
