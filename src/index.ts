import express from 'express'
import cors from 'cors'

import { init, getCachedData } from './scraper'

const app = express()

init();


app.use(express.static('public'))

app.use(cors());
app.get('/api', (req, res) => {
    try {

        let recentData = getCachedData()
        if (typeof req?.query?.groups === 'string') {
            recentData = recentData.filter(group => (req.query.groups as string).split(',').includes(group.name))
        }
        if (typeof req?.query?.status === 'string') {
            recentData = recentData.map(group => {
                return { name: group.name, channels: group.channels.filter(channel => (req.query.status as string).split(',').includes(channel.status)) }
            }).filter(group => group.channels.length)
        }

        if (typeof req?.query.maxHoursUpcoming) {
            recentData = recentData.map(({ name, channels }) => {
                return {
                    name, channels: channels.map(channel => {
                        if (channel.status === 'UPCOMING' && (channel.stream.unixTime - Date.now()) / 3.6e+6 > parseInt(req.query.maxHoursUpcoming as string)) channel.status = 'OFFLINE';
                        return channel
                    })
                }
            })
        }
        res.status(200).send(JSON.stringify(recentData)).end()
    } catch (ex: any) {
        console.log(ex);
        res.status(500).send("slo u kurac");
    }


})

app.listen(process.env.PORT || 8080, () => console.log('Server running'))