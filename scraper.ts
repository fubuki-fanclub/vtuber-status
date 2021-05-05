import pptr from 'puppeteer'
import fs from 'fs'

import { groups, refreshInterval } from './settings.json'
const browserJs = fs.readFileSync('./browser.js').toString()

let browser: pptr.Browser
let browserPage: pptr.Page

let cachedData : any = []

export function getCachedData () {
    return JSON.parse(JSON.stringify(cachedData))
}

export async function init() {
    browser = await pptr.launch({
        headless: false,
    })
    browserPage = await browser.newPage()
    await browserPage.setExtraHTTPHeaders({ "Accept-Language": "en" })
    const cookies = require('./cookies.json')
    await browserPage.setCookie(...cookies)

    await refreshCache()

    setInterval(refreshCache, refreshInterval)

    async function refreshCache() {
        try {
            cachedData = await scrapeGroup()
        } catch (e) {}
    }
}

async function scrapeGroup () {
    const channels = []
    for (const group of groups) {
        const tmp  = []
        for ( const { name, id } of group.channels) {
            console.log(`Scraping ${name}`);
            tmp.push({...await scrapeChannel(id), name, id,})
        }
        channels.push({ name: group.group, channels: tmp })
    }
    return channels
}

async function scrapeChannel(channelId: string): Promise<Channel> {
    try {
        await browserPage.goto(
            `https://www.youtube.com/channel/${channelId}`,
            { timeout: 0, waitUntil: 'networkidle2' })

            return await browserPage.evaluate(browserJs) as Channel
    } catch (e) {
        console.error(`failed @ ${channelId}\n${e.toString()}`)
        throw e
    }
}

interface Channel {
    id: string,
    name: string,
    avatar: string,
    subscribers: string,
    status: 'LIVE' | 'UPCOMING' | 'OFFLINE',
    stream: any
}
