const express = require('express')
const cors = require('cors')
const app = express()

const { init, getCachedData } = require('./scraper')

init()

app.use(express.static('public'))

app.get('/api', cors(), (req, res) => {
    let recentData = getCachedData()
    if (req.query.groups) recentData = recentData.filter(group => req.query.groups.split(',').includes(group.name))
    if (req.query.status) recentData = recentData.map(group => { return { name: group.name, channels: group.channels.filter(channel => req.query.status.split(',').includes(channel.status)) } }).filter(group => group.channels.length)
    if (req.query.maxHoursUpcoming) recentData = recentData.map(({ name, channels }) => { return { name, channels: channels.map(channel => { if (channel.status === 'UPCOMING' && (channel.stream.unixTime - Date.now()) / 3.6e+6 > req.query.maxHoursUpcoming - 0) channel.status = 'OFFLINE'; return channel })} })

    res.status(200).send(JSON.stringify(recentData)).end()
})

app.listen(process.env.PORT || 8080, () => console.log('Server running'))