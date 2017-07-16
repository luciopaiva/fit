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

        this.definitionMessages = [];
        this.dataMessages = [];
        this.records = [];

        while (this.dataReader.getPosition() < this.header.size + this.header.dataSize) {
            const record = this.readRecord();
            if (record.header.messageType === 1) {
                this.definitionMessages.push(record);
            } else {
                this.dataMessages.push(record);
            }
            this.records.push(record);
        }

        const bytesLeft = (this.length() - this.dataReader.getPosition());

        if (bytesLeft === 2) {
            this.dataReader.read(this.header, { crc2: 'W' });
        } else if (bytesLeft !== 0) {
            throw new Error('Malformed FIT file: unexpected trailing data (' + bytesLeft + ' unknown bytes)');
        }
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
