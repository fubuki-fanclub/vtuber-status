const pptr = require('puppeteer');
const fs = require('fs');

const settings = require('./settings.json');
const browserJs = fs.readFileSync('./browser.js').toString();

var cachedData = []
var browser

function init() {

    pptr.launch()
        .then((browserInstace) => browser = browserInstace)
        .then(refreshCache)

    setInterval(refreshCache, settings.refreshInterval)

    function refreshCache() {
        console.log('Caching channel data ...')
        scrapeGroups(settings.groups, browser).then(data => (cachedData = data) && console.log(data)).catch(e => console.log(e))
    }
}

async function scrapeGroups(groups) {
    const output = [];
    for (const group of groups) {
        console.log(`--- Starting group ${group.group}---`);
        output.push({
            'name': group.group, 'channels': await Promise.all(group.channels.map(async channel => {
                console.log(`Scraping ${channel.name}`);
                const { status, stream, avatar, subscribers } = await scrapeChannel(channel.id);
                channel['status'] = status
                channel['stream'] = stream
                channel['avatar'] = avatar
                channel['subscribers'] = subscribers
                return channel;
            }))
        })
    }
    return output;
}

/**
 * @param {String} channelId 
 * @param {Page} page 
 */
async function scrapeChannel(channelId,) {
    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({ "Accept-Language": "en" });    
    await page.goto(`https://www.youtube.com/channel/${channelId}`, { timeout: 0, waitUntil: 'networkidle0' });
    try {
        const acc = await page.evaluate(browserJs);
        page.close()
        return acc
    } catch(e) {
        console.log(`failed @ ${channelId}`);
        console.error(e)
        page.close()
        return await scrapeChannel(channelId)
    }
}

module.exports = {
    init,
    getCachedData: () => JSON.parse(JSON.stringify(cachedData)),
}