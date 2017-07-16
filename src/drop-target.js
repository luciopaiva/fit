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
                reader.addEventListener('load', re => callback(fileInfo.name, re.target.result));
                reader.readAsArrayBuffer(fileInfo);
            }
        });
    }

    static prevent(e) {
        e.stopPropagation();
        e.preventDefault();
    }
}
