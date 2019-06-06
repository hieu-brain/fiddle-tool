let FiddleApp = (function () {
    "use strict"

    let _listFileName = []

    let inputLocalHandle = function (event) {
        event.preventDefault()
        let index = this.dataset.index
        _listFileName[index]['local_path'] = keyWordDecode(event.target.value)
        updateFileList(index, 'local')
    }

    let inputWebHandle = function (event) {
        event.preventDefault()
        let index = this.dataset.index
        _listFileName[index]['web_path'] = keyWordDecode(event.target.value)
        updateFileList(index, 'web')
    }

    let inputExactChange = function (event) {
        event.preventDefault()
        writeExportFile()
    }

    /**
     * Bind EventListener
     */
    let bindEventListener = () => {
        let dropArea = document.getElementById('drop_area')

        dropArea.addEventListener("dragover", event => {
            event.preventDefault()
            event.target.className = 'dragover'
        }, false)

        dropArea.addEventListener("dragleave", event => {
            event.preventDefault()
            event.target.className = ''
        }, false)

        dropArea.addEventListener("drop", dropHandle, false)
        document.getElementById('option_extract').addEventListener('change', inputExactChange, false)
    }

    /**
     * Scan file và trả về 1 Promise thông tin file
     * @param entry - Thư mục
     * @param result - Mảng kết quả
     * @returns {Promise<void>} - Trả về 1 promise
     */
    let scanFiles = async (entry, result) => {
        switch (true) {
            case (entry.isDirectory) :
                // Nếu tham số nhập vào là 1 thư mục (Directory)
                const entryReader = entry.createReader()
                // Dùng readEntries lấy ra thư mục con trong entryReader và trả về 1 mảng các phần tử con
                const entries = await new Promise(resolve => {
                    entryReader.readEntries(entries => resolve(entries))
                })
                // tạo Promise gọi lại hàm scanFiles để scan vào phần tử con
                await Promise.all(entries.map(childEntry => scanFiles(childEntry, result)))
                break
            case (entry.isFile) :
                // Nếu tham số nhập vào là file thì thêm phần tử vào mảng kết quả
                result.push(entry.fullPath)
                break
        }
    }

    /**
     * Update HTML list local path
     * @param index - Index of ListFileName Array
     * @param type
     */
    let updateFileList = function (index, type) {
        let _typeLocal = type === 'local'
        let _list = _typeLocal ? document.getElementById('local_list_' + index) : document.getElementById('web_list_' + index)
        // _list.innerHTML = ''
        let _listHTML = ''
        if (_typeLocal)
            _listFileName[index]['list'].forEach((value) => {
                _listHTML += '<li class="list-group-item">' + _listFileName[index]['local_path'] + value.replace(/\//g, "\\") + '</li>'
            })
        else
            _listFileName[index]['list'].forEach((value) => {
                _listHTML += '<li class="list-group-item">' + _listFileName[index]['web_path'] + value + '</li>'
            })
        _list.innerHTML = _listHTML
        writeExportFile()
    }

    /**
     * Return formatted data from handle function
     * @param listFile - get list update form Update API
     */
    let bindFileList = (listFile) => {
        let tmpListFile = {}
        tmpListFile['list'] = []
        tmpListFile['local_path'] = ''
        tmpListFile['web_path'] = ''
        tmpListFile['list'] = listFile.map(value => {
            return value
        })
        return tmpListFile
    }

    let renderHTML = () => {
        let listContent = document.getElementById('list_content')
        listContent.innerHTML = ''
        _listFileName.forEach((value, index) => {
            let tmpDivLocal = createHTMLElement(value, index, 'local')
            listContent.appendChild(tmpDivLocal)
            tmpDivLocal = createHTMLElement(value, index, 'web')
            listContent.appendChild(tmpDivLocal)
            let _tmpHr = document.createElement('hr')
            _tmpHr.className = 'col-12 mt-2 mb-5'
            listContent.appendChild(_tmpHr)
        })
        writeExportFile()
    }

    /**
     * Return HTML Element
     * @param listData
     * @param index
     * @param type
     * @returns {HTMLDivElement}
     */
    let createHTMLElement = (listData, index, type) => {
        let typeLocal = type === 'local'

        let _tmpInput = document.createElement('input')
        _tmpInput.type = 'text'
        _tmpInput.placeholder = `Enter ${typeLocal ? 'local path' : 'URL'}`
        _tmpInput.dataset.index = index.toString()
        _tmpInput.className = 'form-control'

        let _tmpInputHelp = document.createElement('small')
        _tmpInputHelp.className = 'form-text text-muted'
        _tmpInputHelp.textContent = typeLocal ? 'Add your local link' : `Add website's url`

        let localHTML = `
            <div class='form-group mx-auto'>
                <label class='inputText col-12'></label>
            </div>
            <ul class='list-group list-group-flush ${typeLocal ? 'js-localList' : 'js-webList'}' id='${typeLocal ? 'local_list_' + index : 'web_list_' + index}'></ul>`

        let tmpDivLocal = document.createElement('div')
        tmpDivLocal.className = 'col-12 col-md-6'
        tmpDivLocal.innerHTML = localHTML
        tmpDivLocal.dataset.index = index.toString()

        let _label = tmpDivLocal.getElementsByClassName('inputText')[0]
        _label.appendChild(_tmpInput)
        _label.appendChild(_tmpInputHelp)

        let _ul = tmpDivLocal.getElementsByClassName('list-group')[0]
        _ul.innerHTML = bindListItems(listData['list'], typeLocal ? 'local' : 'web', listData['local_path'])

        // listContent.appendChild(tmpDivLocal)

        if (typeLocal)
            _tmpInput.addEventListener('input', inputLocalHandle, false)
        else
            _tmpInput.addEventListener('input', inputWebHandle, false)
        return tmpDivLocal
    }

    /**
     * Return HTML of list link with type
     * @param listItem - object list Item
     * @param type - 'local' : Local type, 'web' : Web type
     * @param path - Directories or Domain URL
     * @returns {string} - HTML code list
     */
    let bindListItems = function (listItem, type, path) {
        let _listItemHTML = ''
        if (type === 'local') {
            listItem.forEach((v) => _listItemHTML += `<li class="list-group-item">${path + v.replace(/\//g, "\\")}</li>`)
        } else if (type === 'web') {
            listItem.forEach((v) => _listItemHTML += `<li class="list-group-item">${path + v}</li>`)
        }
        return _listItemHTML
    }


    /**
     * Handle Drop event
     * @param event
     * @returns {Promise<void>}
     */
    let dropHandle = async (event) => {
        event.preventDefault()
        event.target.className = ''
        // Tham chiếu DataTransferItemList từ Object DataTransfer
        const items = event.dataTransfer.items
        const results = [] // mảng kết quả tạm ()
        const promise = []
        for (const item of items) {
            // Sử dụng chức năng của webkit browser
            const entry = item.webkitGetAsEntry()
            // Push kết quả sau khi scanFiles hoàn thành
            promise.push(scanFiles(entry, results))
        }
        // resolve All promise khi vòng lặp hoàn thành
        await Promise.all(promise)
        _listFileName.push(bindFileList(results))
        console.log(results) // Test kết quả
        renderHTML()
        console.log("_listFileName", _listFileName)
        console.log("done!!")
    }

    /**
     * Do not show HTML tag format when render html
     * @param searchKeyword - form url query
     * @returns {XML|string|*}
     */
    function keyWordDecode(searchKeyword) {
        searchKeyword = searchKeyword.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return searchKeyword;
    }

    /**
     * Write autoresponder.farx using "Blob" and create link download
     */
    let writeExportFile = function () {
        let exactOption = document.getElementById('option_extract').checked ? 'EXACT:' : ''
        if (_listFileName.length > 0) {
            // $('#exportButton').removeClass('disabled')
            document.getElementById('exportButton').classList.remove('disabled')
            let content = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<AutoResponder>\n<State Enabled=\"false\" Fallthrough=\"true\" UseLatency=\"true\">\n"
            _listFileName.forEach((value => {
                value['list'].forEach((v) => {
                    content += "    <ResponseRule Match=\"" + exactOption + (value['web_path'] + v) + "\" Action=\"" + (value['local_path'] + v.replace(/\//g, "\\")) + "\" Enabled=\"true\" />\n"
                })
            }))
            content += "</State>\n</AutoResponder>"
            let blob = new Blob([content], {type: "text/plain;charset=utf-8"})
            let textFile = window.URL.createObjectURL(blob)
            let downloadButton = document.getElementById('exportButton')
            downloadButton.href = textFile
        } else {
            exactOption.addClass('disabled')
        }
    }


    let init = function () {
        bindEventListener()
    }

    return {
        init: init,
    }
})()

//usage
FiddleApp.init()
