let FiddleApp = (function () {
    "use strict"

    let _listFileName = []

    let onChange = function (e) {
        e.stopPropagation()
        e.preventDefault()

        let entries = e.target.webkitEntries
        console.log("entries", entries)
    }

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
    }

    let scanFiles = async (entry, tmpObject) => {
        switch (true) {
            case (entry.isDirectory) :
                const entryReader = entry.createReader()
                const entries = await new Promise(resolve => {
                    entryReader.readEntries(entries => resolve(entries))
                })
                await Promise.all(entries.map(childEntry => scanFiles(childEntry, tmpObject)))
                break
            case (entry.isFile) :
                tmpObject.push(entry.fullPath)
                break
        }
    }

    let dropHandle = async (event) => {
        event.preventDefault()
        event.target.className = ''
        const items = event.dataTransfer.items
        const results = []
        const promise = []
        for (const item of items) {
            const entry = item.webkitGetAsEntry()
            promise.push(scanFiles(entry, results))
        }
        await Promise.all(promise)
        _listFileName.push(results)
        console.log(results) //テスト表示
        console.log("_listFileName", _listFileName)
        console.log("done!!")
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
