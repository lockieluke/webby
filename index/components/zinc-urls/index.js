function getURL(term) {
    switch (term) {
        case 'newtab':
            return 'pages/newtab/index.html'

        case 'history':
            return 'pages/history/index.html'
    }
}

module.exports = {getURL}