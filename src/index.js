"use strict";

/**
 * Main app class.
 */
class FitApp {

    constructor () {
        this.fitFile = null;
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
        DropTarget.apply(this.dropTargetScreen, (fileName, buffer) => this.processFitFile(fileName, buffer));

        // Main screen
        this.fileInfoField = document.getElementById('file-info');
        this.fileHeaderTable = document.getElementById('file-header-table').querySelector('tbody');
        this.rowTemplate = document.getElementById('file-header-row-template').querySelector('tr');
        this.fileContentsTable = document.getElementById('file-contents-table').querySelector('tbody');
        this.fileFooterTable = document.getElementById('file-footer-table').querySelector('tbody');
    }

    async onSampleButtonClick() {
        const buffer = await FileLoader.load(FitApp.SAMPLE_FIT_FILE_NAME);
        await this.processFitFile(FitApp.SAMPLE_FIT_FILE_NAME, buffer);
    }

    async initializeScreens() {
        this.dropTargetScreen = document.getElementById(FitApp.SCREEN_DROP);
        this.loadingScreen = document.getElementById(FitApp.SCREEN_LOADING);
        this.mainScreen = document.getElementById(FitApp.SCREEN_MAIN);
        this.errorScreen = document.getElementById(FitApp.SCREEN_ERROR);

        /** @type {Map<string, Node>} */
        this.screenByName = new Map();
        this.screenByName.set(FitApp.SCREEN_DROP, this.dropTargetScreen);
        this.screenByName.set(FitApp.SCREEN_LOADING, this.loadingScreen);
        this.screenByName.set(FitApp.SCREEN_MAIN, this.mainScreen);
        this.screenByName.set(FitApp.SCREEN_ERROR, this.errorScreen);

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
     * @param {string} fileName
     * @param {ArrayBuffer} buffer
     */
    async processFitFile(fileName, buffer) {
        await this.switchScreen(FitApp.SCREEN_LOADING);

        try {
            this.fitFile = FitFileParser.parseFromBuffer(buffer);
        } catch (error) {
            if (error instanceof FitParserException) {
                await this.showErrorMessage(error.message);
                return;
            }
            throw error;
        }

        await this.switchScreen(FitApp.SCREEN_MAIN);

        this.fileInfoField.innerText = `${fileName} (${buffer.byteLength} bytes)`;

        // bind header info
        this.addInfoRow('Header size', this.fitFile.header.size + ' B', this.fileHeaderTable);
        this.addInfoRow('Protocol version', this.fitFile.header.protocolVersion, this.fileHeaderTable);
        this.addInfoRow('Profile version', this.fitFile.header.profileVersion, this.fileHeaderTable);
        this.addInfoRow('Data size', this.fitFile.header.dataSize + ' B', this.fileHeaderTable);
        this.addInfoRow('Magic', '"' + this.fitFile.header.magic + '"', this.fileHeaderTable);
        this.addInfoRow('CRC', '0x' + this.fitFile.header.crc.toString(16), this.fileHeaderTable);

        // bind contents info
        this.addInfoRow('Definition messages', this.fitFile.sections.length, this.fileContentsTable);
        const numberOfDataMessages = this.fitFile.sections.reduce(
            (acc, section) => acc + section.fitDataMessages.length, 0);
        this.addInfoRow('Total data messages', numberOfDataMessages, this.fileContentsTable);

        // bind footer info
        this.addInfoRow('CRC', '0x' + this.fitFile.footer.crc.toString(16), this.fileFooterTable);
    }

    addInfoRow(key, value, container) {
        let tr = this.rowTemplate.cloneNode(true);
        let [tdKey, tdValue] = tr.querySelectorAll('td');
        tdKey.innerText = key;
        tdValue.innerText = value;
        container.appendChild(tr);
    }

    async showErrorMessage(message) {
        this.errorScreen.querySelector('h1').innerText = message;
        await this.switchScreen(FitApp.SCREEN_ERROR);
    }
}

FitApp.SAMPLE_FIT_FILE_NAME = 'sample/lax-ventura.fit';
FitApp.SCREEN_DROP = 'drop-target-screen';
FitApp.SCREEN_LOADING = 'loading-screen';
FitApp.SCREEN_MAIN = 'main-screen';
FitApp.SCREEN_ERROR = 'error-screen';

// since the script is deferred, this will only run after the page is loaded
(new FitApp()).initialize();
