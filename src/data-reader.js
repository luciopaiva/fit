"use strict";

/**
 * Helper class to read binary data.
 */
class DataReader {

    /**
     * @param {ArrayBuffer} buffer
     */
    constructor (buffer) {
        this.buffer = buffer;
        this.dataView = new DataView(buffer);
        this.position = 0;
        this.isLittleEndian = true;
    }

    setEndianness(endianness) {
        this.isLittleEndian = endianness === DataReader.ENDIANNESS_LITTLE;
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

    readInt8() {
        const result = this.dataView.getInt8(this.position);
        this.position++;
        return result;
    }

    readUint16() {
        const result = this.dataView.getUint16(this.position, this.isLittleEndian);
        this.position += 2;
        return result;
    }

    readInt16() {
        const result = this.dataView.getInt16(this.position, this.isLittleEndian);
        this.position += 2;
        return result;
    }

    readUint32() {
        const result = this.dataView.getUint32(this.position, this.isLittleEndian);
        this.position += 4;
        return result;
    }

    readInt32() {
        const result = this.dataView.getInt32(this.position, this.isLittleEndian);
        this.position += 4;
        return result;
    }

    readFloat32() {
        const result = this.dataView.getFloat32(this.position, this.isLittleEndian);
        this.position += 4;
        return result;
    }

    readFloat64() {
        const result = this.dataView.getFloat64(this.position, this.isLittleEndian);
        this.position += 8;
        return result;
    }

    /**
     * Read a string of up to `length` bytes. The string is considered to be null-terminated, so it can end earlier
     * without any problems. Regardless, the position marker will move `length` bytes. The string does not have to
     * terminate with a null char if it occupies `length` bytes.
     *
     * @param {number} length - maximum size of the string to read
     * @return {string}
     */
    readString(length) {
        const bufferSlice = this.dataView.buffer.slice(this.position, this.position + length);
        const buffer = new Uint8Array(bufferSlice);

        let actualLength = 0;
        for (let i = 0; i < length; i++) {
            if (buffer[i] === 0) {
                break;
            }
            actualLength = i + 1;
        }

        this.position += length;
        return String.fromCharCode(...buffer.subarray(0, actualLength));
    }
}

DataReader.ENDIANNESS_LITTLE = 1;
DataReader.ENDIANNESS_BIG = 2;
