"use strict";

/**
 * Helper class to parse FIT files.
 */
class FitFileParser {

    /**
     * Parses the raw contents of a FIT file into a FitFile class.
     *
     * @param {ArrayBuffer} buffer
     * @return {FitFile}
     */
    static parseFromBuffer(buffer) {
        const dataReader = new DataReader(buffer);

        const fitFile = new FitFile();

        // FIT file header
        FitFileParser.parseFileHeader(dataReader, fitFile);

        // FIT file records
        const bytesLeft = FitFileParser.parseFileContent(dataReader, fitFile);

        // FOOTER
        FitFileParser.parseFileFooter(dataReader, fitFile, bytesLeft);

        return fitFile;
    }

    /**
     * @private
     * @param {DataReader} dataReader
     * @param {FitFile} fitFile
     */
    static parseFileHeader(dataReader, fitFile) {
        dataReader.read(fitFile.header, {
            size: 'B', protocolVersion: 'B', profileVersion: 'W', dataSize: 'D', magic: 'S4'
        });

        if (fitFile.header.magic !== '.FIT') {
            throw new FitParserException('Invalid FIT file format (header signature was not found)');
        }

        if (fitFile.header.size === 14) {
            dataReader.read(fitFile.header, { crc: 'W' });
        }
    }

    /**
     * @private
     * @param {DataReader} dataReader
     * @param {FitFile} fitFile
     * @return {number} number of bytes left in the file after contents are processed
     */
    static parseFileContent(dataReader, fitFile) {
        /** @type {FitFileSection} */
        let section = null;

        // iterate through all existing records, parsing each one into either FitDefinitionMessage or FitDataMessage
        while (dataReader.getPosition() < fitFile.header.size + fitFile.header.dataSize) {
            const definitionMessage = section !== null ? section.fitDefinitionMessage : null;
            const message = FitFileParser.readMessage(dataReader, definitionMessage);

            if (message instanceof FitDefinitionMessage) {
                // FIT definition message
                if (section !== null) {
                    // first save any pending section
                    fitFile.sections.push(section);
                }
                // then create a new section and save the message definition in it
                section = new FitFileSection();
                section.fitDefinitionMessage = message;

                // const messageType = FIT_MESSAGE_TYPES.get(message.globalMessageNumber);
                // console.info(messageType.name);
                // for (const field of message.fields) {
                //     console.info('-> ' + messageType.fieldById.get(field.fieldDefinitionNumber).name);
                // }

            } else if (message instanceof FitDataMessage) {
                // FIT data message
                section.fitDataMessages.push(message);
            } else {
                throw new FitParserException('Unknown FIT message: ' + message.constructor.name);
            }
        }

        // save the last opened section
        if (section !== null) {
            fitFile.sections.push(section);
        }

        return (dataReader.dataView.byteLength - dataReader.getPosition());  // number of bytes left in the file
    }

    /**
     * @private
     * @param {DataReader} dataReader
     * @param {FitFile} fitFile
     * @param {number} bytesLeft
     */
    static parseFileFooter(dataReader, fitFile, bytesLeft) {
        if (bytesLeft === 2) {
            dataReader.read(fitFile.footer, { crc: 'W' });
        } else if (bytesLeft !== 0) {
            throw new FitParserException('Malformed FIT file: unexpected trailing data (' + bytesLeft +
                ' unknown bytes)');
        }
    }

    /**
     * @private
     * @param {DataReader} dataReader
     * @param {FitDefinitionMessage} definitionMessage
     * @return {FitMessage}
     */
    static readMessage(dataReader, definitionMessage) {
        const recordHeader = FitFileParser.readMessageHeader(dataReader);
        let message;

        if (recordHeader.headerType === 0) {  // normal header
            if (recordHeader.messageType === 1) {  // definition message
                message = FitFileParser.readDefinitionMessage(dataReader, recordHeader);
            } else {  // data message
                if (definitionMessage === null) {
                    throw new FitParserException('Data message was not preceded by a FitDefinitionMessage');
                }
                message = FitFileParser.readDataMessage(dataReader, definitionMessage, recordHeader);
            }
        } else {  // compressed header
            throw new FitParserException('Compressed headers are not supported yet');
        }

        return message;
    }

    /**
     * @private
     * @param {DataReader} dataReader
     * @return {FitMessageHeader}
     */
    static readMessageHeader(dataReader) {
        const recordHeader = new FitMessageHeader();
        dataReader.readByteBits(recordHeader,
            { headerType: 1, messageType: 1, messageTypeSpecific: 1, reserved: 1, localMessageType: 4 });
        return recordHeader;
    }

    /**
     * @private
     * @param {DataReader} dataReader
     * @param {FitMessageHeader} recordHeader
     * @return {FitDefinitionMessage}
     */
    static readDefinitionMessage(dataReader, recordHeader) {
        const record = new FitDefinitionMessage(recordHeader);

        record.dataMessagePayloadSize = 0;

        dataReader.read(record, { reserved: 'B', architecture: 'B' });

        const isLittleEndian = record.architecture === 0;
        dataReader.setEndianness(isLittleEndian ? DataReader.ENDIANNESS_LITTLE : DataReader.ENDIANNESS_BIG);

        dataReader.read(record, { globalMessageNumber: 'W', numberOfFields: 'B'});

        // field definitions
        record.fields = [];
        for (let fi = 0; fi < record.numberOfFields; fi++) {
            const field = new FitDefinitionField();
            record.fields.push(field);
            dataReader.read(field, {fieldDefinitionNumber: 'B', size: 'B', baseType: 'B'});
        }

        record.dataMessagePayloadSize += record.fields
            .map(field => field.size).reduce((acc, val) => acc + val, 0);

        // developer field definitions
        if (recordHeader.messageTypeSpecific === 1) {  // has developer data
            dataReader.read(record, { developerNumberOfFields: 'B'});

            record.developerFields = [];
            for (let fi = 0; fi < record.developerNumberOfFields; fi++) {
                const field = new FitDeveloperDefinitionField();
                record.developerFields.push(field);
                dataReader.read(field, {fieldNumber: 'B', size: 'B', developerDataIndex: 'B'});
            }

            record.dataMessagePayloadSize += record.developerFields
                .map(field => field.size).reduce((acc, val) => acc + val, 0);
        }

        return record;
    }

    /**
     * @private
     * @param {DataReader} dataReader
     * @param {FitDefinitionMessage} definitionMessage
     * @param {FitMessageHeader} messageHeader
     * @return {FitDataMessage}
     */
    static readDataMessage(dataReader, definitionMessage, messageHeader) {
        const dataMessage = new FitDataMessage(messageHeader);
        if (messageHeader.messageTypeSpecific === 1) {
            throw new FitParserException('messageTypeSpecific field should not be 1 for data messages');
        }

        for (const fieldDefinition of definitionMessage.fields) {
            let size = 1;

            switch (fieldDefinition.baseType) {
                case 0x00: // enum, 1 byte
                case 0x02: // uint8
                case 0x0A: // uint8z
                case 0x0D: // byte
                    dataMessage.fields.push(FitFileParser.readSeries(dataReader.readUint8.bind(dataReader), size));
                    break;
                case 0x01: // sint8
                    dataMessage.fields.push(FitFileParser.readSeries(dataReader.readInt8.bind(dataReader), size));
                    break;
                case 0x83: // sint16
                    size = Math.floor(fieldDefinition.size / 2);
                    dataMessage.fields.push(FitFileParser.readSeries(dataReader.readInt16.bind(dataReader), size));
                    break;
                case 0x84: // uint16
                case 0x8B: // uint16z
                    size = Math.floor(fieldDefinition.size / 2);
                    dataMessage.fields.push(FitFileParser.readSeries(dataReader.readUint16.bind(dataReader), size));
                    break;
                case 0x85: // sint32
                    size = Math.floor(fieldDefinition.size / 4);
                    dataMessage.fields.push(FitFileParser.readSeries(dataReader.readInt32.bind(dataReader), size));
                    break;
                case 0x86: // uint32
                case 0x8C: // uint32z
                    size = Math.floor(fieldDefinition.size / 4);
                    dataMessage.fields.push(FitFileParser.readSeries(dataReader.readUint32.bind(dataReader), size));
                    break;
                case 0x07: // null-terminated string
                    size = fieldDefinition.size;
                    dataMessage.fields.push(dataReader.readString(fieldDefinition.size));
                    break;
                case 0x88: // float32
                    size = Math.floor(fieldDefinition.size / 4);
                    dataMessage.fields.push(FitFileParser.readSeries(dataReader.readFloat32.bind(dataReader), size));
                    break;
                case 0x89: // float64
                    size = Math.floor(fieldDefinition.size / 8);
                    dataMessage.fields.push(FitFileParser.readSeries(dataReader.readFloat64.bind(dataReader), size));
                    break;
                case 0x8E: // sint64
                    size = Math.floor(fieldDefinition.size / 8);
                    dataReader.skip(8 * size);
                    dataMessage.fields.push(-1);
                    // dataMessage.fields.push(dataReader.readInt64());  // ToDo implement me!
                    break;
                case 0x8F: // uint64
                case 0x90: // uint64z
                    size = Math.floor(fieldDefinition.size / 8);
                    dataReader.skip(8 * size);
                    dataMessage.fields.push(-1);
                    // dataMessage.fields.push(dataReader.readUint64());  // ToDo implement me!
                    break;
                default:
                    throw new FitParserException('Unknown field base type ' + fieldDefinition.baseType);
            }
        }
        // dataReader.skip(definitionMessage.dataMessagePayloadSize);
        return dataMessage;
    }

    static readSeries(reader, times) {
        if (times === 1) {
            return reader();
        } else {
            const result = [];
            for (let i = 0; i < times; i++) {
                result.push(reader());
            }
            return result;
        }
    }
}

class FitParserException extends Error {
    constructor (message) {
        super(message);
    }
}
