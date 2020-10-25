"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const ytIdRegex = /(?<=\?v=).{11}/;
function generateDOM(data) {
    if (data.error) {
        return generateErrorDOM('Error', data.error);
    }
    else if (data.groups) {
        return generateMainDOM(data.groups);
    }
    else {
        return generateErrorDOM('Unknown error', 'Shit prolly went very bad');
    }
}
function generateMainDOM(groups) {
    const dom = document.createElement('div');
    dom.classList.add('group-list');
    for (const group of groups) {
        dom.appendChild(generateGroupDOM(group));
    }
    return dom;
}
function generateGroupDOM(group) {
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
function generateChannelDOM(channel) {
    const dom = document.createElement('div');
    dom.classList.add('channel');
    const name = document.createElement('a');
    name.classList.add('name');
    name.textContent = channel.name;
    //name.href = `https://www.youtube.com/channel/${channel.id}`;
    dom.appendChild(name);
    name.addEventListener('click', handleClick);
    const status = document.createElement('div');
    status.classList.add('status');
    switch (channel.status) {
        case "LIVE" /* LIVE */:
            status.textContent = "LIVE";
            dom.classList.add('live');
            break;
        case "UPCOMING" /* UPCOMING */:
            if (channel.stream)
                status.textContent = streamStartToString(channel.stream.unixTime);
            else
                status.textContent = '???'; //this should never happen
            dom.classList.add('upcoming');
            break;
        case "OFFLINE" /* OFFLINE */:
            dom.classList.add('offline');
            break;
    }
    dom.appendChild(status);
    return dom;
}
function streamStartToString(startUnixTime) {
    const timeTillStart = (startUnixTime - Date.now()) / 1000;
    if (timeTillStart > 3600 * 24)
        return '...';
    if (timeTillStart < 0)
        return 'LIVE?';
    if (timeTillStart < 60)
        return 'STARTING';
    if (timeTillStart < 3600)
        return `${Math.round(timeTillStart / 60)}`;
    const hours = Math.floor(timeTillStart / 3600), minutes = Math.floor((timeTillStart % 3600) / 60);
    return `${hours}h ${minutes != 0 ? minutes + 'm' : ''}`;
}
function generateErrorDOM(title, description) {
    const dom = document.createElement('div');
    dom.classList.add('error');
    //add title
    const titleElement = document.createElement('h1');
    titleElement.classList.add('title');
    titleElement.textContent = title;
    dom.appendChild(titleElement);
    //add description
    const descElement = document.createElement('p');
    descElement.classList.add('description');
    descElement.textContent = description;
    dom.appendChild(descElement);
    return dom;
}
function setPopupDOM(popup, channel) {
    var _a, _b;
    Array.from(popup.children).forEach(x => popup.removeChild(x)); //kill all children xd
    const channelInfo = document.createElement('div');
    channelInfo.classList.add('channel-info');
    popup.appendChild(channelInfo);
    const avatar = document.createElement('img');
    avatar.width = 64;
    avatar.height = 64;
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
        case "LIVE" /* LIVE */:
            status.classList.add('live');
            status.innerHTML = `Streaming: <br> ${(_a = channel.stream) === null || _a === void 0 ? void 0 : _a.title}`;
            break;
        case "UPCOMING" /* UPCOMING */:
            status.classList.add('upcoming');
            status.innerHTML = `Waiting room for: <br> ${(_b = channel.stream) === null || _b === void 0 ? void 0 : _b.title}`;
            break;
        case "OFFLINE" /* OFFLINE */:
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
function handleClick(ev) {
    var _a, _b, _c, _d, _e;
    const groupName = (_c = (_b = (_a = this.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.querySelector('p.title')) === null || _c === void 0 ? void 0 : _c.textContent;
    const channelName = this.textContent;
    console.log(groupName);
    console.log(channelName);
    const me = (_e = (_d = data.groups) === null || _d === void 0 ? void 0 : _d.find(x => x.name == groupName)) === null || _e === void 0 ? void 0 : _e.channels.find(x => x.name == channelName);
    const popupHost = document.querySelector('#pop-host');
    const popup = popupHost === null || popupHost === void 0 ? void 0 : popupHost.querySelector('.popup');
    if (popup && me)
        setPopupDOM(popup, me);
    popupHost === null || popupHost === void 0 ? void 0 : popupHost.classList.remove('hide');
}
function hide(me) {
    me.classList.add('hide');
    Array.from(me.children[0].children).forEach(x => me.children[0].removeChild(x));
}
let data;
function channelToCompNum(channel) {
    if (channel.status == "LIVE" /* LIVE */)
        return 0;
    if (channel.status == "UPCOMING" /* UPCOMING */)
        return 1;
    if (channel.status == "OFFLINE" /* OFFLINE */)
        return 2;
    return -1;
}
fetch('http://31.15.215.249/api/?maxHoursUpcoming=24', { method: 'GET' }).then((res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const newData = { groups: yield res.json() };
    data = { groups: [] };
    if (newData.groups) {
        for (const g of newData.groups) {
            (_a = data.groups) === null || _a === void 0 ? void 0 : _a.push({
                name: g.name, channels: g.channels.sort((a, b) => channelToCompNum(a) - channelToCompNum(b))
            });
        }
    }
    (_b = document.getElementById('app')) === null || _b === void 0 ? void 0 : _b.appendChild(generateDOM(data));
})).catch((err) => {
    var _a;
    console.log(err);
    data = { error: err };
    (_a = document.getElementById('app')) === null || _a === void 0 ? void 0 : _a.appendChild(generateDOM(data));
});
//document.getElementById('app')?.appendChild(generateDOM(data));
