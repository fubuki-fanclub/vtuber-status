import pptr from 'puppeteer'
import fs from 'fs'

import config from '../settings.json'
const browserJs = fs.readFileSync('./src/browser.js').toString()

let browser: pptr.Browser
let browserPage: pptr.Page

let cachedData: Group[] = []


interface Channel {
    id: string,
    name: string,
    avatar: string,
    subscribers: string,
    status: 'LIVE' | 'UPCOMING' | 'OFFLINE',
    stream: any
}

interface Group {
    name: string,
    channels: Channel[]
}

export function getCachedData() {
    return cachedData
}

export async function init() {
    browser = await pptr.launch({
        headless: false,
    })
    browserPage = await browser.newPage()
    await browserPage.setExtraHTTPHeaders({ "Accept-Language": "en" })
    const cookies = require('../cookies.json')
    await browserPage.setCookie(...cookies)

    await refreshCache()

    setInterval(refreshCache, config.refreshInterval)

    async function refreshCache() {
        try {
            cachedData = await scrapeGroups()
        } catch (e) { }
    }
}

async function scrapeGroups(): Promise<Group[]> {
    const groups: Group[] = [];
    for (const group of config.groups) {
        const tmp = []
        for (const { name, id } of group.channels) {
            console.log(`Scraping ${name}`);
            tmp.push({ ...await scrapeChannel(id), name, id, })
        }
        groups.push({ name: group.group, channels: tmp })
    }
    return groups;
}

async function scrapeChannel(channelId: string): Promise<Channel> {
    try {
        await browserPage.goto(
            `https://www.youtube.com/channel/${channelId}`,
            { timeout: 0, waitUntil: 'networkidle2' })

        return await browserPage.evaluate(browserJs) as Channel
    } catch (e: any) {
        console.error(`failed @ ${channelId}\n${e.toString()}`)
        throw e;
    }
}
