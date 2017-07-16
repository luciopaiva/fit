"use strict";

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

        const dataView = new DataView(buffer);
        const dataReader = new DataReader(dataView);

        try {
            this.fit = new FitParser(dataReader);
        } catch (error) {
            await this.showErrorMessage(error.message);
            return;
        }

        await this.switchScreen(FitApp.SCREEN_MAIN);

        this.fileInfoField.innerText = `${fileName} (${buffer.byteLength} bytes)`;

        // bind header info
        // size: 'B', protocolVersion: 'B', profileVersion: 'W', dataSize: 'D', magic: 'S4'
        this.addInfoRow('Header size', this.fit.header.size + ' B', this.fileHeaderTable);
        this.addInfoRow('Protocol version', this.fit.header.protocolVersion, this.fileHeaderTable);
        this.addInfoRow('Profile version', this.fit.header.profileVersion, this.fileHeaderTable);
        this.addInfoRow('Data size', this.fit.header.dataSize + ' B', this.fileHeaderTable);
        this.addInfoRow('Magic', '"' + this.fit.header.magic + '"', this.fileHeaderTable);
        this.addInfoRow('CRC', this.fit.header.crc, this.fileHeaderTable);

        this.addInfoRow('Records', this.fit.records.length, this.fileContentsTable);

        this.addInfoRow('CRC', this.fit.header.crc2, this.fileFooterTable);
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
