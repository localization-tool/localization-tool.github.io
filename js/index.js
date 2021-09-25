Number.prototype.floor = function() {
    return Math.floor(this);
}
Number.prototype.ceil = function() {
    return Math.ceil(this);
}
Number.prototype.round = function(places = 1) {
    return (10**places*this+0.5).floor()/10**places;
}
Array.last = function(arr) {
    return arr[arr.length - 1];
}
$.fn.setSelection = function(from, to = from) {
    this[0].setSelectionRange(from, to);
    return this;
}

//! ==============================================================
//!         input regex
//! ==============================================================
function applyRegexToInput(val, patternArr, caretPosition) {
    if (!Array.isArray(patternArr)) patternArr = [patternArr, ''];
    let safetySwitch = 0;
    while (val.match(patternArr[0])) {
        if (safetySwitch > 99) throw 'Executing of regex patterns on input took too long, action aborted';
        let lengthBefore = val.length;
        val = val.replace(patternArr[0], patternArr[1]);
        $(this).val(val);
        caretPosition -= lengthBefore - val.length;
        if (patternArr[2]) caretPosition+= patternArr[2];
        safetySwitch++;
    }
    return [val, caretPosition];
}
function processMultipleRegexes(regexArray, input, e) {
    let val = $(input).val();
    let caretPosition = e.target.selectionStart; 
    regexArray.forEach(function(patternArr) {
        [val, caretPosition] = applyRegexToInput(val, patternArr, caretPosition);
    });
    $(input).val(val);
    input.setSelectionRange(caretPosition, caretPosition);
}
let regexes = {
    int: [
        /[^0-9\-]/,
        /^0/,
        [ /(.+)-/, '$1' ],
        [ /^(-?)0{2,}/, '$10' ],
    ],
    positive: [
        /\-/,
    ],
}

$('[regex~="int"]').on('input', function(e) {
    processMultipleRegexes(regexes.int, this, e);
});
$('[regex~="positive"]').on('input', function(e) {
    processMultipleRegexes(regexes.positive, this, e);
});

//! ==============================================================
//!         processing uploaded file
//! ==============================================================
let nativeEntries = [];
let nativeEntriesMap = new Map();
let translatedEntries = [];
let translatedEntriesMap = new Map();
let resultMap = new Map();
let tableEntryRows = [];
let totalCount = 0;
let completedCount = 0;
function loadObjectEntriesJSON(loadTo, loadToMap, lines) {
    //clear objects from old values
    loadTo.splice(0, loadTo.length);
    loadToMap.clear();
    //process lines
    let i = -1;
    for (const line of lines) {
        i++;
        //line is a space
        if (!line.trim()) {
            let lastEntryType = Array.last(loadTo).type
            if (lastEntryType == "SPACE" || lastEntryType == "COMMENT") continue;
            loadTo.push({ type: "SPACE" });
        }
        let match = line.match(/"(.+?)":\s*"(.*)"/);
        if (!match) continue;
        let [_, key, value] = match;
        //line is a comment
        if (key.startsWith('_')) {
            loadTo.push({ type: "COMMENT", value });
            continue;
        }
        //line is an entry
        if (loadToMap.get(key)) console.warn(`Duplicated entry: "${key}" in line ${i}.`);
        loadTo.push({ type: "ENTRY", key, value });
        loadToMap.set(key, { value, completed: false });
    }
    resultMap = new Map([ ...nativeEntriesMap, ...translatedEntriesMap ]);
}
function loadObjectEntriesLANG(loadTo, loadToMap, lines) {
    //clear objects from old values
    loadTo.splice(0, loadTo.length);
    loadToMap.clear();
    //process lines
    let i = -1;
    for (const line of lines) {
        i++;
        //line is a space
        if (!line.trim()) {
            let lastEntryType = Array.last(loadTo).type;
            if (lastEntryType == "SPACE" || lastEntryType == "COMMENT") continue;
            loadTo.push({ type: "SPACE" });
            continue;
        }
        //line is a comment
        if (line.match(/^#\s*(.+)/)) {
            let value = line.match(/^#\s*(.+)/)[1];
            let lastEntryType = Array.last(loadTo).type;
            if (lastEntryType != "SPACE") loadTo.push({ type: "SPACE" });
            loadTo.push({ type: "COMMENT", value });
            continue;
        }
        //line is an entry
        let match = line.match(/^\s*(.+?)=(.*)$/);
        if (!match) continue;
        let [_, key, value] = match;
        if (loadToMap.get(key)) console.warn(`Duplicated entry: "${key}" in line ${i}.`);
        loadTo.push({ type: "ENTRY", key, value });
        loadToMap.set(key, { value, completed: false });
    }
    resultMap = new Map([ ...nativeEntriesMap, ...translatedEntriesMap ]);
}
function checkFileExtension(file) {
    return file.name.match(/\.([^ \.]+)$/)?.[1];
}
//! native entries
$('#upload-native').change(function(e) {
    const reader = new FileReader();
    let firstFile = e.target.files[0];
    reader.onload = function(e) {
        let lines = e.target.result.split('\n');
        let fileExtension = checkFileExtension(firstFile);
        nativeEntries.splice(0, nativeEntries.length);
        nativeEntriesMap.clear();
        if (fileExtension == 'json') {
            loadObjectEntriesJSON(nativeEntries, nativeEntriesMap, lines);
        }
        else if (fileExtension == 'lang') {
            loadObjectEntriesLANG(nativeEntries, nativeEntriesMap, lines);
        }
    }
    reader.readAsText(e.target.files[0]);
});
//! partially translated entries
$('#upload-translated').change(function(e) {
    const reader = new FileReader();
    let firstFile = e.target.files[0];
    reader.onload = function(e) {
        let lines = e.target.result.split('\n');
        let fileExtension = checkFileExtension(firstFile);
        translatedEntries.splice(0, translatedEntries.length);
        translatedEntriesMap.clear();
        if (fileExtension == 'json') {
            loadObjectEntriesJSON(translatedEntries, translatedEntriesMap, lines);
        }
        else if (fileExtension == 'lang') {
            loadObjectEntriesLANG(translatedEntries, translatedEntriesMap, lines);
        }
    }
    reader.readAsText(e.target.files[0]);
});
//! load button
function loadTable() {
    $('section.shortcuts, section.results, section.toolbar').removeClass('hidden');
    //tell which entries are completed
    resultMap.forEach((value, key) => {
        if (nativeEntriesMap.get(key) && value.value != nativeEntriesMap.get(key).value) {
            resultMap.set(key, {
                value: value.value,
                completed: true,
                markedFilled: value.markedFilled,
            });
        }
    })
    //construct the table
    let table = $('.results-table');
    table.find('tbody').html(null);
    let i = 1;
    nativeEntries.forEach((entry, index) => {
        setTimeout(() => {
            switch (entry.type) {
                case 'SPACE':
                    new GapRow().addToTable(table);
                    break;
                case 'COMMENT':
                    new CommentRow(entry.value).addToTable(table);
                    break;
                case 'ENTRY':
                    let completed = resultMap.get(entry.key).completed;
                    new EntryRow({
                        num: i++,
                        index,
                        key: entry.key,
                        valueOriginal: entry.value,
                        value: completed ? resultMap.get(entry.key).value : '',
                        completed,
                        markedFilled: resultMap.get(entry.key).markedFilled,
                    }).addToTable(table);
                    totalCount++;
                    if (completed) completedCount++;
                    break;
            }
        }, 0);
    });
}
$('#load-uploads').click(function() {
    if (!$('#upload-native').val()) return;
    loadTable();
    clearUploads();
    saveAllToLocalStorage();
})
//! clear button
function clearUploads() {
    $('#upload-native').val(null);
    $('#upload-translated').val(null);
}
$('#clear-uploads').click(clearUploads);
//! table row classes
class TableRow {
    constructor() {
        $.extend(this, $(`<tr></tr>`));
    }
    addToTable(table) {
        table.find('tbody').append(this);
        return this;
    }
}
class GapRow extends TableRow {
    constructor() {
        super();
        this.addClass('gap-row');
        this.append(`<td colspan="4"></td>`);
    }
}
class CommentRow extends TableRow {
    constructor(text) {
        super();
        this.addClass('comment-row');
        this.append(`<th colspan="4">${text}</th>`);
    }
}
class EntryRow extends TableRow {
    constructor({ num, key, valueOriginal, value, completed, markedFilled, index }) {
        super();
        this.addClass('entry-row');
        this.num = num;
        this.index = index;
        this.key = key;
        tableEntryRows.push(this);
        //! append elements ======================================
        this.append(`<td class="entry-num">${num}</td>`);
        this.append(`<td class="entry-original">
            <span>${valueOriginal}</span>
            <code>${key.replace(/\./g, '.&#8203;')}</code>
        </td>`);
        this.append(`<td class="entry-input">
            <textarea num="${num}">${value ?? ''}</textarea>
        </td>`);
        this.append(`<td class="entry-buttons">
            <button class="generic-container button-generic green mark-as-filled" tabindex="-1"><i class="fas fa-check"></i></button>
        </td>`);
        //! add functionality ====================================
        let textarea = this.find('textarea');
        this.textarea = textarea;
        let markFilledButton = this.find('.mark-as-filled')
        //! is completed?
        if (completed) textarea.addClass('filled');
        if (markedFilled) textarea.addClass('marked-filled');
        //! mark as filled button
        function markAsFilledButtonFunctionality() {
            textarea.toggleClass('marked-filled');
            markFilledButton.toggleClass('active').blur();
            let oldValue = resultMap.get(key);
            oldValue.markedFilled = textarea.hasClass('marked-filled');
            resultMap.set(key, oldValue);
            if (textarea.hasClass('marked-filled')) {
                completedCount++;
            }
            else completedCount--;
            saveAllToLocalStorage();
        }
        markFilledButton.click(markAsFilledButtonFunctionality);
        //! textarea check if is filled
        textarea.on('blur', function() {
            if (
                textarea.val().trim()
                && valueOriginal != textarea.val()
            ) {
                textarea.addClass('filled');
            }
        });
        textarea.on('input', function() {
            textarea.removeClass('filled');
        })
        //! textarea bind keyboard shortcuts
        const globalThis = this;
        textarea.keydown(function(e) {
            if (e.metaKey || e.ctrlKey) {
                if (e.key == 's') {
                    e.preventDefault();
                    markAsFilledButtonFunctionality();
                    if (textarea.hasClass('marked-filled')) {
                        globalThis.focusNextRow();
                    }
                    return;
                }
                if (e.key == 'd') {
                    e.preventDefault();
                    textarea.val(valueOriginal);
                    return;
                }
            }
        });
        //! update resultMap
        textarea.on('input', function() {
            let oldValue = resultMap.get(key);
            oldValue.value = textarea.val()
            resultMap.set(key, oldValue);
            saveAllToLocalStorage();
        });
        //! select textarea on focus
        textarea.on('focus', function() {
            let cursorPos;
            setTimeout(() => {
                cursorPos = textarea[0].selectionStart;
                if (cursorPos == textarea.val().length && cursorPos != 0) {
                    textarea.setSelection(0, textarea.val().length);
                }
            }, 10);
        })
    }
    focusNextRow() {
        tableEntryRows[this.num].textarea.focus();
    }
}

//! ==============================================================
//!         local storage interactions
//! ==============================================================
function saveAllToLocalStorage() {
    localStorage.setItem('isSaved', 'true');
    localStorage.setItem('nativeEntries', JSON.stringify(nativeEntries));
    localStorage.setItem('nativeEntriesMap', JSON.stringify(Array.from(nativeEntriesMap.entries())));
    localStorage.setItem('translatedEntriesMap', JSON.stringify(Array.from(translatedEntriesMap.entries())));
    localStorage.setItem('resultMap', JSON.stringify(Array.from(resultMap.entries())));
}
function loadAllFromLocalStorage() {
    if (localStorage.getItem('isSaved')) {
        nativeEntries = JSON.parse(localStorage.getItem('nativeEntries'));
        nativeEntriesMap = new Map(JSON.parse(localStorage.getItem('nativeEntriesMap')));
        translatedEntriesMap = new Map(JSON.parse(localStorage.getItem('translatedEntriesMap')));
        resultMap = new Map(JSON.parse(localStorage.getItem('resultMap')));
        loadTable();
    }
}
loadAllFromLocalStorage();

//! ==============================================================
//!         toolbar
//! ==============================================================
$('#go-to-btn').click(function() {
    if (!$('#go-to').val()) return;
    let targetRow = $(`[num="${$('#go-to').val()}"]`);
    if (!targetRow[0]) return;
    targetRow.focus().get(0).scrollIntoView();
})

//! ==============================================================
//!         downloading code
//! ==============================================================
$('#dropdown-toggle').click(function(e){
    $(this).next().toggleClass('active');
    e.stopPropagation();
});
$('body,html').click(function(e){
    if (!$('#dropdown-toggle').next().is(e.target) && $('#dropdown-toggle').next().has(e.target).length === 0) {
        $('#dropdown-toggle').next().removeClass('active');
    }
});
//! functions for generating downloadable code
function generateLocalizedFileJSON() {
    const rows = $('.results-table tbody tr');

    const retArray = [ '{' ];
    for (let row of rows) {
        row = $(row);
        if (row.hasClass('gap-row')) {
            retArray.push('    ');
            continue;
        }
        if (row.hasClass('comment-row')) {
            retArray.push(`    "${'_comment'}": "${row.children('th').html()}",`);
            continue;
        }
        if (row.hasClass('entry-row')) {
            let value = row.find('textarea').is('.filled,.marked-filled') ? row.find('textarea').val() : row.find('.entry-original > span').html();
            retArray.push(`    "${row.find('.entry-original > code').html().replace(/​/g, '')}": "${value}",`);
            continue;
        }
    }
    retArray.push('}');
    return retArray.join('$$NEWLINE_HERE$$').replace(/^(.+),/, '$1').replace(/\$\$NEWLINE_HERE\$\$/g, '\n');
}
function generateLocalizedFileLANG() {
    const rows = $('.results-table tbody tr');

    const retArray = [ '{' ];
    for (let row of rows) {
        row = $(row);
        if (row.hasClass('gap-row')) {
            retArray.push('');
            continue;
        }
        if (row.hasClass('comment-row')) {
            retArray.push(`# ${row.children('th').html()}`);
            continue;
        }
        if (row.hasClass('entry-row')) {
            let value = row.find('textarea').is('.filled,.marked-filled') ? row.find('textarea').val() : row.find('.entry-original > span').html();
            retArray.push(`${row.find('.entry-original > code').html().replace(/​/g, '')}=${value},`);
            continue;
        }
    }
    retArray.push('}');
    return retArray.join('$$NEWLINE_HERE$$').replace(/^(.+),/, '$1').replace(/\$\$NEWLINE_HERE\$\$/g, '\n');
}
function copyToClipboard(str) {
    let el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style = {display: "none"};
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, 9999999);
    document.execCommand('copy');
    document.body.removeChild(el);
}
function downloadFile(contents, { name, type, extension }) {
    let dataStr = `data:${type};charset=utf-8,` + encodeURIComponent(contents);
    let aEl = $('<a></a>');
    aEl.attr("href", dataStr);
    aEl.attr("download", name + "." + extension);
    $('body').append(aEl); // required for firefox
    aEl[0].click();
    aEl.remove();
}
//! add functionality to buttons
$('#download-json').click(function() {
    let text = generateLocalizedFileJSON();
    downloadFile(text, {
        name: 'localized_file',
        type: 'application/json',
        extension: 'json',
    });
});
$('#download-lang').click(function() {
    let text = generateLocalizedFileLANG();
    downloadFile(text, {
        name: 'localized_file',
        type: 'text/plain',
        extension: 'lang',
    });
});
$('#download-copy-json').click(function () {
    copyToClipboard(generateLocalizedFileJSON());
});
$('#download-copy-lang').click(function () {
    copyToClipboard(generateLocalizedFileLANG());
});