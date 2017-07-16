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
        this.numberOfFields = -1;
        this.fields = [];
        this.developerNumberOfFields = -1;
        this.developerFields = [];
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
