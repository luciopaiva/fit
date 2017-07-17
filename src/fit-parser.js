"use strict";

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

        // FIT file header

        this.dataReader.read(this.header, {
            size: 'B', protocolVersion: 'B', profileVersion: 'W', dataSize: 'D', magic: 'S4'
        });

        if (this.header.magic !== '.FIT') {
            throw new Error('Invalid FIT file format (header signature was not found)');
        }

        if (this.header.size === 14) {
            this.dataReader.read(this.header, { crc: 'W' });
        }

        // FIT file records

        /** @type {FitDefinitionMessage[]} */
        this.definitionMessages = [];
        /** @type {FitDataMessage[]} */
        this.dataMessages = [];
        /** @type {FitMessage[]} */
        this.records = [];

        let dataMessagesCount = -1;
        while (this.dataReader.getPosition() < this.header.size + this.header.dataSize) {
            const record = this.readRecord();
            if (record instanceof FitDefinitionMessage) {
                this.definitionMessages.push(record);
                if (dataMessagesCount !== -1) {
                    console.info(`${dataMessagesCount} data messages`);
                }
                dataMessagesCount = 0;
                console.info(record);
            } else if (record instanceof FitDataMessage) {
                this.dataMessages.push(record);
                dataMessagesCount++;
            } else {
                throw new Error('Unknown FIT message: ' + record.constructor.name);
            }
            this.records.push(record);
        }
        console.info(`${dataMessagesCount} data messages`);

        const bytesLeft = (this.length() - this.dataReader.getPosition());

        if (bytesLeft === 2) {
            this.dataReader.read(this.header, { crc2: 'W' });
        } else if (bytesLeft !== 0) {
            throw new Error('Malformed FIT file: unexpected trailing data (' + bytesLeft + ' unknown bytes)');
        }
    }

    /**
     * @return {FitMessage}
     */
    readRecord() {
        const recordHeader = this.readRecordHeader();
        let record;

        if (recordHeader.headerType === 0) {  // normal header
            if (recordHeader.messageType === 1) {  // definition message
                record = this.readDefinitionMessage(recordHeader);
            } else {  // data message
                record = this.readDataMessage(recordHeader);
            }
        } else {  // compressed header
            throw new Error('Found compressed header');
        }

        return record;
    }

    /**
     * @return {FitRecordHeader}
     */
    readRecordHeader() {
        const recordHeader = new FitRecordHeader();
        this.dataReader.readByteBits(recordHeader,
            { headerType: 1, messageType: 1, messageTypeSpecific: 1, reserved: 1, localMessageType: 4 });
        return recordHeader;
    }

    /**
     * @param {FitRecordHeader} recordHeader
     * @return {FitDefinitionMessage}
     */
    readDefinitionMessage(recordHeader) {
        const recordContent = new FitDefinitionMessage(recordHeader);

        this.recordPayloadSize = 0;

        this.dataReader.read(recordContent, { reserved: 'B', architecture: 'B' });

        const isLittleEndian = recordContent.architecture === 0;
        this.dataReader.setEndianness(isLittleEndian ? DataReader.ENDIANNESS_LITTLE : DataReader.ENDIANNESS_BIG);

        this.dataReader.read(recordContent, { globalMessageNumber: 'W', numberOfFields: 'B'});

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

    /**
     * @param {FitRecordHeader} recordHeader
     * @return {FitDataMessage}
     */
    readDataMessage(recordHeader) {
        const recordContent = new FitDataMessage(recordHeader);
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
