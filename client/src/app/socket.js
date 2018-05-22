import _ from 'lodash';

const STATUS = Object.freeze({
    SENDING:    1 << 0,
    PROCESSING: 1 << 1,
    RECEIVING:  1 << 2,
});

function send(url, items, callback) {
    return new Promise((resolve, reject) => {
        /* eslint-disable no-await-in-loop */
        const socket = new WebSocket(url);

        socket.onopen = async () => {
            /* eslint-disable no-restricted-syntax */
            for (const { type, identifier, data } of items) {
                const packages = [`${type}:${identifier}:1`, data];
                const uploadSize = _.sum(_.map(packages, x => x.length || x.byteLength));
                _.each(packages, (x) => { socket.send(x); });
                while (socket.readyState < socket.CLOSED) {
                    callback([
                        STATUS.SENDING,
                        {
                            identifier,
                            loaded: uploadSize - socket.bufferedAmount,
                            total: uploadSize,
                        },
                    ]);
                    if (!(socket.bufferedAmount > 0)) {
                        break;
                    }
                    await new Promise(r => setTimeout(r, 100));
                }
            }
            socket.send('\0');
        };

        let error;
        const response = {};
        const process = (type, identifier, data) => {
            switch (type) {
            case 'error':
                error = data;
                break;
            case 'json':
                response[identifier] = JSON.parse(data);
                break;
            case 'status':
                callback([
                    STATUS.PROCESSING,
                    { message: data },
                ]);
                break;
            default:
                // ignore
            }
        };

        let type = String();
        let identifier = String();
        let chunks = 0;
        let total = 0;
        let data = '';
        socket.onmessage = ({ data: x }) => {
            if (x === '\0') {
                socket.send('');
                return;
            }
            if (chunks === 0) {
                data = '';
                [type, identifier, chunks, total] = x.split(':');
                total = parseInt(total, 10);
            } else {
                chunks -= 1;
                data += x;
                if (chunks === 0) {
                    process(type, identifier, data);
                }
            }
            if (type !== 'status') {
                callback([
                    STATUS.RECEIVING,
                    {
                        identifier,
                        loaded: data.length,
                        total,
                    },
                ]);
            }
        };

        socket.onclose = () => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        };

        socket.onerror = reject;
    });
}

export default send;
export { STATUS as SOCKET_STATUS };
