// import {Toast} from "../js/toast.js";
// import {stringSimilarity} from '../js/stringSimilarity.js';
const iconMap = {
    success: 'check-circle',
    warn: 'exclamation-circle',
    error: 'exclamation-circle',
    disallow: 'times-circle',
    info: 'info-circle',
}
class Toast {
    static defaults = {
        time: 3000,
    }
    constructor(options) {
        this.hideTimeout = null;
        this.el = document.createElement("div");
        this.el.className = "Toaster toast";
        this.el.textContent = (typeof(options) == "string" ? options : undefined) ?? options?.message ?? options?.msg ?? '';
        if (options && typeof(options) == 'object') {
            if (options.class && typeof(options.class) == "array") {
                options.class.forEach(cl => {
                    this.el.classList.add(cl);
                })
            }
        }
        this.time = options?.time ?? Toast.defaults.time;

        if (options?.type && iconMap[options.type]) {
            this.icon = document.createElement('i');
            this.icon.className = `toast-icon fas fa-${iconMap[options.type]}`;
            this.el.appendChild(this.icon);
        }
        if (options?.closeButton ?? options?.closeBtn ?? true) {

            this.closeBtn = document.createElement('div');
            this.closeBtn.className = `toast-close fas fa-times`;
            this.closeBtn.addEventListener('click', () => {
                this.hide();
            });
            this.el.appendChild(this.closeBtn);
        }

        if (options?.type) {
            this.el.classList.add(`toast--${options.type}`);
        }
        document.body.appendChild(this.el);
    }
    show(time) {
        clearTimeout(this.hideTimeout);
        this.el.classList.add("toast--visible");
        this.hideTimeout = setTimeout(() => {
            this.el.classList.remove("toast--visible");
        }, time ?? this.time);
    }
    hide() {
        clearTimeout(this.hideTimeout);
        this.el.classList.remove("toast--visible");
    }
}

Number.prototype.floor = function() {
    return Math.floor(this);
}
Number.prototype.round = function(places = 1) {
    return (10**places*this+0.5).floor()/10**places;
}
// ============================================
// 
// Variable Declarations
// 
// ============================================

// ======================
// getting needed elements from document
const uploadNative = document.querySelector('#upload-native');
const uploadTranslated = document.querySelector('#upload-translated');
const loadUploadsBtn = document.querySelector('#load-uploads');
const clearUploadsBtn = document.querySelector('#clear-uploads');
let fileNative = {};
let fileTranslated = {};

const searchBar = document.querySelector('#input-search');
const clearSearchBtn = document.querySelector('#clear-search');

const filterEmpty = document.querySelector('#filter-empty');
const filterBookmarked = document.querySelector('#filter-bookmark');

const statsFields = {
    total: document.querySelector('#stats-total'),
    filled: document.querySelector('#stats-filled'),
    filled_perc: document.querySelector('#percent-filled'),
    empty: document.querySelector('#stats-empty'),
    empty_perc: document.querySelector('#percent-empty'),
    bookmarked: document.querySelector('#stats-bookmarked'),
    bookmarked_perc: document.querySelector('#percent-bookmarked'),
}

const findAndReplace = {
    pattern: document.querySelector('#replace-search'),
    replace: document.querySelector('#replace-replace'),
    regex: document.querySelector('#replace-regex'),
    findBtn: document.querySelector('#find-next'),
    replaceBtn: document.querySelector('#replace'),
    replaceAllBtn: document.querySelector('#replace-all'),
}

const downloadCodeBtn = document.querySelector('#download-code');
const copyCodeBtn = document.querySelector('#copy-code');

const saveBtn = document.querySelector('.tools .saved-indicator .save');

// ============================================
// 
// Event Listeners
// 
// ============================================

// file uploader
uploadNative.addEventListener('change', onFileUploadNative);
uploadTranslated.addEventListener('change', onFileUploadTranslated);
loadUploadsBtn.addEventListener('click', loadDataToTable);
clearUploadsBtn. addEventListener('click', () => {
    uploadNative.value = null;
    uploadTranslated.value = null;
    fileNative = {};
    fileTranslated = {};
});

// search bar content clear button
searchBar.addEventListener('input', () => {
    if (searchBar.value) {
        clearSearchBtn.classList.remove('softhidden');
        clearSearchBtn.tabindex = 0;
        findOnPage(searchBar.value, document.querySelector('#entry-table tbody'));
    }
    else {
        clearSearchBtn.classList.add('softhidden');
        clearSearchBtn.tabindex = -1;
    }
});
clearSearchBtn.addEventListener('click', () => {
    searchBar.value = "";
});

// filter checkboxes
filterEmpty.addEventListener('change', filterEmptyFields);
filterBookmarked.addEventListener('change', filterBookmarkedFields);

//find and replace
findAndReplace.findBtn.addEventListener('click', () => {

});

// output buttons
downloadCodeBtn.addEventListener('click', downloadCode);
copyCodeBtn.addEventListener('click', copyCode);

// save button
saveBtn.addEventListener('click', saveToLocalStorage);

// ============================================
// 
// Functions
// 
// ============================================

function onFileUploadNative(event) {
    var reader = new FileReader();
    reader.onload = loadFileNative;
    reader.readAsText(event.target.files[0]);
}
function loadFileNative(event) {
    fileNative = JSON.parse(event.target.result);
}
function onFileUploadTranslated(event) {
    var reader = new FileReader();
    reader.onload = loadFileTranslated;
    reader.readAsText(event.target.files[0]);
}
function loadFileTranslated(event) {
    fileTranslated = JSON.parse(event.target.result);
}

let tableArray = [];
function loadDataToTable() {
    if (!fileNative) {
        new Toast({message: 'No original language file uploaded!', type: 'error'}).show(5000);
        return;
    }

    let keys = Object.keys(fileNative);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        if (key.match(/^_+?$/)) continue;
        let valueO = fileNative[key];
        let valueT = fileTranslated?.[key];
        tableArray.push([
            valueO,
            key.replace(/\./g, '.&#8203;'), // &#8203; = zero-width space (for wrapping purposes)
            valueT ?? valueO,
        ])
    }
    constructEntryTable(tableArray);
}
function constructEntryTable(arr) {
    clearTable('#entry-table');

    let tbody = document.querySelector('#entry-table tbody')
    arr.forEach((val, i) => {
        let row = document.createElement('tr');
        let td1 = document.createElement('td');
        let td2 = document.createElement('td');
        let td3 = document.createElement('td');
        let td4 = document.createElement('td');
        // "no." column
        td1.innerHTML = i+1;
        // "original" column
        let span1 = document.createElement('span');
        span1.innerHTML = val[0];
        td2.appendChild(span1);
        let span2 = document.createElement('span');
        span2.innerHTML = val[1];
        td2.appendChild(span2);
        // "translation" column
        let span3 = document.createElement('span');
        span3.classList = 'textarea input-focus';
        span3.setAttribute('role', 'textbox');
        span3.setAttribute('contenteditable', '');
        span3.addEventListener('input', () => {
            updateInputState(i+1);
            updateStats('filled');
        });
        span3.addEventListener('focus', () => {
            let range, selection;
        
            if (window.getSelection && document.createRange) {
                selection = window.getSelection();
                range = document.createRange();
                range.selectNodeContents(this);
                selection.removeAllRanges();
                selection.addRange(range);
            } else if (document.selection && document.body.createTextRange) {
                range = document.body.createTextRange();
                range.moveToElementText(this);
                range.select();
            }
        });
        span3.innerHTML = val[2] ?? '';
        td3.appendChild(span3);
        // column with buttons
        let div = document.createElement('div');
        let textNode = document.createTextNode(' ');
        let button1 = generateMarkAsFilledButton(i+1);
        div.appendChild(button1);
        div.appendChild(textNode);
        let button2 = document.createElement('button');
        button2.classList = 'copy';
        button2.setAttribute('title', 'copy from original');
        button2.innerHTML = `<i class="far fa-clone"></i>`;
        button2.addEventListener('click', () => {cloneValueInRow(i+1)});
        div.appendChild(button2);
        div.appendChild(textNode);
        let button3 = document.createElement('button');
        button3.classList = 'empty';
        button3.setAttribute('title', 'empty input');
        button3.innerHTML = `<i class="far fa-times-circle"></i>`;
        button3.addEventListener('click', () => {emptyValueInRow(i+1)});
        div.appendChild(button3);
        div.appendChild(textNode);
        let button4 = document.createElement('button');
        button4.classList = 'bookmark';
        button4.setAttribute('title', 'bookmark row');
        button4.innerHTML = `<i class="far fa-bookmark"></i><i class="fas fa-bookmark"></i>`;
        button4.addEventListener('click', () => {bookmarkRow(i+1)});
        div.appendChild(button4);
        div.appendChild(textNode);
        td4.appendChild(div)
        // add all tds to row
        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        row.appendChild(td4);
        tbody.appendChild(row);
    })
    setTimeout(() => {
        updateInputStateOnLoad();
    }, 100);
}
function generateMarkAsFilledButton(index) {
    let input = document.createElement('input');
    input.classList = 'checkbox-custom set-to-filled';
    input.setAttribute('type', 'checkbox');
    input.setAttribute('name', 'filled');
    input.id = 'set-to-filled'+index;
    input.addEventListener('change', () => {
        markAsFilled(index);
        let checkbox = document.querySelector('#set-to-filled'+index);
        checkbox.setAttribute('checked', checkbox.checked);
    });
    let label = document.createElement('label');
    label.classList = 'unselectable checkbox-label set-to-filled-label';
    label.setAttribute('for', 'set-to-filled'+index);
    label.innerHTML = `<span class="checkbox set-to-filled-checkbox"><i class="fas fa-check"></i><i class="fas fa-check"></i></span>`
    let ret = document.createElement('span');
    ret.appendChild(input);
    ret.appendChild(label);
    return ret;
}
function markAsFilled(index) {
    let input = document.querySelector(`#entry-table tbody tr:nth-of-type(${index}) td:nth-of-type(3) span`);
    let checkbox = document.querySelector(`#set-to-filled${index}`);
    input.classList.toggle('marked-filled', checkbox.checked);
    updateStats('filled');
}
function clearTable(selector) {
    if (!selector) return console.error('Function error in clearTable: no selector specified.');
    let table = document.querySelector(selector + ' tbody');
    table.innerHTML = '';
}
function cloneValueInRow(index) {
    let original = document.querySelector(`#entry-table tbody tr:nth-of-type(${index}) td:nth-of-type(2) span:nth-of-type(1)`);
    let translation = document.querySelector(`#entry-table tbody tr:nth-of-type(${index}) td:nth-of-type(3) span`);
    translation.innerHTML = original.innerHTML;
}
function emptyValueInRow(index) {
    let translation = document.querySelector(`#entry-table tbody tr:nth-of-type(${index}) td:nth-of-type(3) span`);
    translation.innerHTML = '';
}
function bookmarkRow(index) {
    let row = document.querySelector(`#entry-table tbody tr:nth-of-type(${index})`);
    row.classList.toggle('bookmarked');
    updateStats('bookmarked');
}
function updateInputState(index) {
    let original = document.querySelector(`#entry-table tbody tr:nth-of-type(${index}) td:nth-of-type(2) span:nth-of-type(1)`);
    let translation = document.querySelector(`#entry-table tbody tr:nth-of-type(${index}) td:nth-of-type(3) span`);
    if (!translation.innerText.trim() || original.innerText == translation.innerText || stringSimilarity(original.innerText, translation.innerText) >= 0.80) {
        translation.classList.add('empty');
        translation.classList.remove('filled');
    }
    else {
        translation.classList.add('filled');
        translation.classList.remove('empty');
    }
}
function updateInputStateOnLoad() {
    let lastID = document.querySelector('#entry-table tbody tr:last-child :first-child')?.innerHTML;
    for (let i = 1; i <= lastID; i++) {
        setTimeout(() => {
            updateInputState(i);
        }, 10);
    }
    setTimeout(() => {
        updateStats();
        addELToTableItems();
    }, 1000);
}
function updateStats(type) {
    if (!type || type == 'total') {
        let lastID = document.querySelector('#entry-table tbody tr:last-child :first-child').innerHTML;
        statsFields.total.innerHTML = lastID;
    }
    if (!type || type == 'filled' || type == 'empty') {
        let empty = document.querySelectorAll('#entry-table .textarea.empty:not(.marked-filled)');
        let filled = document.querySelectorAll('#entry-table .textarea.filled:not(.marked-filled)');
        let markedFilled = document.querySelectorAll('#entry-table .textarea.marked-filled');
        statsFields.filled.innerHTML = filled.length + markedFilled.length;
        statsFields.empty.innerHTML = empty.length;
        let total = Number(statsFields.total.textContent);
        statsFields.filled_perc.innerHTML = ((filled.length + markedFilled.length) / total * 100).round(2) + '%';
        statsFields.empty_perc.innerHTML = (empty.length / total * 100).round(2) + '%';
    }
    if (!type || type == 'bookmarked') {
        let entries = document.querySelectorAll('#entry-table .bookmarked');
        statsFields.bookmarked.innerHTML = entries.length;
        let total = Number(statsFields.total.textContent);
        statsFields.bookmarked_perc.innerHTML = (entries.length / total * 100).round(2) + '%';
    }
}
function loadFromLocalStorage() {
    let tbody = document.querySelector('#entry-table tbody');
    try {
        tbody.innerHTML = localStorage.getItem('tableBackup');
        if (localStorage.getItem('tableBackup'))  {
            setTimeout(() => {
                updateInputStateOnLoad();
            }, 100);
        }
    } catch (error) {
        console.error(error);
    }
}
loadFromLocalStorage();
function saveToLocalStorage() {
    let savedIndicator = document.querySelector('.tools .saved-indicator')
    savedIndicator.classList.add('saving');
    let string = document.querySelector('#entry-table tbody').innerHTML;
    try {
        localStorage.setItem('tableBackup', string);
        savedIndicator.classList.remove('saving');
        savedIndicator.classList.add('saved');
        setTimeout(() => {
            savedIndicator.classList.remove('saved');
        }, 3000);
    } catch (error) {
        console.error(error);
    }
    
}
setInterval(() => {
    saveToLocalStorage();
}, 60*1000);

function addELToTableItems() {
    let rows = document.querySelectorAll('#entry-table tbody tr');

    rows.forEach((row, i) => {
        row.querySelector('.textarea').addEventListener('input', () => {
            updateInputState(i+1);
            updateStats('filled');
        });
        row.querySelector('.textarea').addEventListener('focus', () => {
            let range;
            range = document.body.createTextRange();
            range.moveToElementText(this);
            range.select();
        });
        row.querySelector('.set-to-filled'). addEventListener('change', () => {
            markAsFilled(i+1);
            let checkbox = document.querySelector('#set-to-filled'+(i+1));
            checkbox.setAttribute('checked', checkbox.checked);
        });
        row.querySelector('button.copy'). addEventListener('click', () => {cloneValueInRow(i+1)});
        row.querySelector('button.empty'). addEventListener('click', () => {emptyValueInRow(i+1)});
        row.querySelector('button.bookmark'). addEventListener('click', () => {bookmarkRow(i+1)});
    })
}
function generateLocalizationObject() {
    let rows = document.querySelectorAll('#entry-table tbody tr');

    let retObj = {};
    rows.forEach(row => {
        let key = row.querySelector('td:nth-of-type(2) span:nth-of-type(2)').innerText;
        let value = row.querySelector('.textarea').innerText;
        retObj[key] = value;
    })
    return retObj;
}
function downloadCode() {
    let code = generateLocalizationObject();
    downloadObjectAsJson(code, 'localized_code');
}
function copyCode() {
    let code = generateLocalizationObject();
    copyToClipboard(JSON.stringify(code, null, 4));
}
function filterEmptyFields() {
    unhideRows();
    let rows = document.querySelectorAll('#entry-table tbody tr');

    rows.forEach(row => {
        let input = row.querySelector('.textarea')
        if (filterEmpty.checked && !input.classList.contains('empty') || input.classList.contains('marked-filled')) {
            row.classList.add('hidden');
        }
    })
}
function filterBookmarkedFields() {
    unhideRows();
    let rows = document.querySelectorAll('#entry-table tbody tr');
    rows.forEach(row => {
        if (!row.classList.contains('bookmarked') && filterBookmarked.checked) {
            row.classList.add('hidden');
        }
    })
}
function unhideRows() {
    let rows = document.querySelectorAll('#entry-table tbody tr');
    rows.forEach(row => {
        row.classList.remove('hidden');
    })
}
// taken from https://stackoverflow.com/questions/10473745/compare-strings-javascript-return-of-likely
function stringSimilarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    let longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    
    let costs = new Array();
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

const copyButtons = document.querySelectorAll('.copyToClipboard');
copyButtons.forEach(el => {
    el.addEventListener('click', () => {
        copyToClipboard(el.getAttribute('copyValue'));
    });
})
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
    new Toast({message: 'Copied', type: 'success'}).show(2000);
}
//taken from https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 4));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
let n = 0;
function findOnPage(text, scope = document.body, searchNth = false) {
    let innerHTML = scope.innerHTML;
    scope.innerHTML = innerHTML.replace(/<span class="search-result">(.+?)<\/span>/g, '$1')
    if (searchNth) {
        if (!n) {
            scope.innerHTML = innerHTML.replace(new RegExp(text), '<span class="search-result">$&</span>')
        }
        else {
            scope.innerHTML = innerHTML.replace(new RegExp("(?<=(?:("+text+")(?:\n|.)*?){"+n+"})\\1"), '<span class="search-result">$&</span>')
        }
        n++;
    }
    else {
        scope.innerHTML = innerHTML.replace(new RegExp(text, 'g'), '<span class="search-result">$&</span>')
    }
}