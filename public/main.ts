const ytIdRegex = /(?<=\?v=).{11}/;
const enum streamStatus {
    LIVE = 'LIVE',
    UPCOMING = 'UPCOMING',
    OFFLINE = 'OFFLINE'
}

interface youtubeStream {
    title: string,
    url: string,
    thubnailUrl: string,
    unixTime: number
}

interface youtubeChannel {
    name: string,
    id: string,
    avatar: string,
    status: streamStatus,
    stream?: youtubeStream
    subscribers?: string
}

interface group {
    name: string,
    channels: Array<youtubeChannel>
}

interface response {
    error?: string,
    groups?: Array<group>
}


function generateDOM(data: response) {

    if (data.error) {
        return generateErrorDOM('Error', data.error);
    } else if (data.groups) {
        return generateMainDOM(data.groups);
    } else {
        return generateErrorDOM('Unknown error', 'Shit prolly went very bad');
    }
}

function generateMainDOM(groups: Array<group>): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('group-list');

    for (const group of groups) {
        dom.appendChild(generateGroupDOM(group));
    }

    return dom;
}

function generateGroupDOM(group: group): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('group');

    const title = document.createElement('p');
    title.classList.add('title');
    title.textContent = group.name;
    dom.appendChild(title);

    for (const channel of group.channels) {
        dom.appendChild(generateChannelDOM(channel));
    }

    return dom;
}

function generateChannelDOM(channel: youtubeChannel): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('channel');

    const name = document.createElement('a');
    name.classList.add('name');
    name.textContent = channel.name;
    //name.href = `https://www.youtube.com/channel/${channel.id}`;
    dom.appendChild(name);
    name.addEventListener('click', handleClick)

    const status = document.createElement('div');
    status.classList.add('status');
    switch (channel.status) {
        case streamStatus.LIVE:
            status.textContent = "LIVE";
            dom.classList.add('live');
            break;

        case streamStatus.UPCOMING:
            if (channel.stream)
                status.textContent = streamStartToString(channel.stream.unixTime);
            else
                status.textContent = '???'; //this should never happen
            dom.classList.add('upcoming');
            break;

        case streamStatus.OFFLINE:
            dom.classList.add('offline');
            break;
    }
    dom.appendChild(status);



    return dom;
}

function streamStartToString(startUnixTime: number): string {
    const timeTillStart = (startUnixTime - Date.now()) / 1000;
    if (timeTillStart > 3600 * 24) return '...';
    if (timeTillStart < 0) return 'LIVE?';
    if (timeTillStart < 60) return 'STARTING';
    if (timeTillStart < 3600) return `${Math.round(timeTillStart / 60)}m`;
    const hours = Math.floor(timeTillStart / 3600), minutes = Math.floor((timeTillStart % 3600) / 60);
    return `${hours}h ${minutes != 0 ? minutes + 'm' : ''}`;
}

function generateErrorDOM(title: string, description: string): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('error');

    //add title
    const titleElement = document.createElement('h1');
    titleElement.classList.add('title');
    titleElement.textContent = title;
    dom.appendChild(titleElement);

    //add description
    const descElement = document.createElement('p');
    descElement.classList.add('description')
    descElement.textContent = description;
    dom.appendChild(descElement);

    return dom;
}

function setPopupDOM(popup: HTMLElement, channel: youtubeChannel) {
    Array.from(popup.children).forEach(x => popup.removeChild(x)); //kill all children xd

    const channelInfo = document.createElement('div');
    channelInfo.classList.add('channel-info');
    popup.appendChild(channelInfo);

    const avatar = document.createElement('img');
    avatar.width= 64;
    avatar.height= 64;
    avatar.src = channel.avatar;
    avatar.classList.add('channel-info-img');
    channelInfo.appendChild(avatar);

    const moreInfo = document.createElement('div');
    moreInfo.classList.add('channel-info-more');
    channelInfo.appendChild(moreInfo);

    const channelName = document.createElement('h1');
    channelName.innerText = channel.name;
    channelName.classList.add('channel-info-name');
    moreInfo.appendChild(channelName);

    const subCount = document.createElement('p');
    subCount.classList.add('channel-info-subcount');
    subCount.innerText = channel.subscribers || 'Can\'t get subs';
    moreInfo.appendChild(subCount);

    const status = document.createElement('p');
    status.classList.add('channel-info-status');
    switch (channel.status) {
        case streamStatus.LIVE:
            status.classList.add('live');
            status.innerHTML = `Streaming: <br> ${channel.stream?.title}`;
            break;
        case streamStatus.UPCOMING:
            status.classList.add('upcoming');
            status.innerHTML = `Waiting room for: <br> ${channel.stream?.title}`;

            break;
        case streamStatus.OFFLINE:
            status.classList.add('offline');
            status.innerText = 'OFFLINE :(';
            break;
    }
    moreInfo.appendChild(status);

    if (channel.stream) {
        const embed = document.createElement('iframe');
        embed.width = '560';
        embed.height = '315';
        embed.src = `https://www.youtube.com/embed/${ytIdRegex.exec(channel.stream.url)}`;
        embed.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media;';
        popup.appendChild(embed);
    }
}

function handleClick(this: HTMLElement, ev: MouseEvent) {
    const groupName = this.parentElement?.parentElement?.querySelector('p.title')?.textContent;
    const channelName = this.textContent;
    console.log(groupName);
    console.log(channelName);
    const me = data.groups?.find(x => x.name == groupName)?.channels.find(x => x.name == channelName);


    const popupHost = document.querySelector<HTMLElement>('#pop-host');
    const popup = popupHost?.querySelector<HTMLElement>('.popup');
    if (popup && me)
        setPopupDOM(popup, me);
    popupHost?.classList.remove('hide');
}

function hide(me: HTMLElement) {
    me.classList.add('hide');
    Array.from(me.children[0].children).forEach(x => me.children[0].removeChild(x));
}


let data: response;

function channelToCompNum(channel: youtubeChannel): number {
    if (channel.status == streamStatus.LIVE) return 0;
    if (channel.status == streamStatus.UPCOMING) return 1;
    if (channel.status == streamStatus.OFFLINE) return 2;
    return -1;
}

fetch('http://31.15.215.249/api/?maxHoursUpcoming=24', { method: 'GET' }).then(async (res) => {
    const newData: response = { groups: await res.json() };
    data = { groups: [] };
    if (newData.groups) {
        for (const g of newData.groups) {
            data.groups?.push({
                name: g.name, channels: g.channels.sort((a, b) => channelToCompNum(a)-channelToCompNum(b))
            })
        }
    }
    document.getElementById('app')?.appendChild(generateDOM(data));
}).catch((err) => {
    console.log(err);
    data = { error: err };
    document.getElementById('app')?.appendChild(generateDOM(data));
})

//document.getElementById('app')?.appendChild(generateDOM(data));