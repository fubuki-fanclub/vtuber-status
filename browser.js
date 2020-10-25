(() => {
    const nParent = (e, x) => x > 0 ? nParent(e.parentElement, x - 1) : e;
    function toObj(el, status) {
        const parent = nParent(el, 5);
        return {
            stream: {
                title: parent.querySelector('yt-formatted-string.style-scope.ytd-video-renderer')?.textContent ?? parent.querySelector('#video-title').textContent,
                thumbnailUrl: parent.querySelector('img').src,
                url: parent.querySelector('#thumbnail').href,
                unixTime: status == 'UPCOMING' ? new Date(parent.querySelector('#metadata-line>span:nth-child(2)').textContent.replace('Scheduled for ', '')).getTime() : undefined
            },
            status,
        }
    }
    const { status, stream } = Array.from(document.getElementsByTagName('ytd-thumbnail-overlay-time-status-renderer')).reduce((s, x) => {
        if (x.overlayStyle === 'LIVE' && s.status !== 'LIVE') return toObj(x, 'LIVE');
        if (x.overlayStyle === 'UPCOMING' && s.status !== 'LIVE') if (s.status === 'UPCOMING') {
            const newObj = toObj(x, 'UPCOMING');
            return (newObj.stream.unixTime < s.stream.unixTime) ? newObj : s;
        } else return toObj(x, 'UPCOMING');
        return s;
    }, { status: 'OFFLINE', });

    return {
        status,
        stream,
        subscribers: document.getElementById('subscriber-count').innerText,
        avatar: document.querySelector('#avatar > #img').src,
    }
})();