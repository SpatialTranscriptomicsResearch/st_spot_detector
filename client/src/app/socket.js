const STATUS = Object.freeze({
    SENDING:    1 << 0,
    PROCESSING: 1 << 1,
    RECEIVING:  1 << 2,
});

function send(url, data, callback) {
    return new Promise(async (resolve, reject) => {
        /* eslint-disable no-await-in-loop */
        const whileTrue = async (f) => {
            while (f()) {
                await new Promise(r => setTimeout(r, 100));
            }
        };

        const socket = new WebSocket(url);

        const sendData = async () => {
            const payload = JSON.stringify(data);
            const size = payload.length;

            socket.send(payload);
            await whileTrue(() => {
                const remaining = socket.bufferedAmount;
                callback([
                    STATUS.SENDING,
                    {
                        loaded: size - remaining,
                        total: size,
                    },
                ]);
                return remaining > 0;
            });
        };

        await whileTrue(() =>
            socket.readyState === socket.CONNECTING);

        const transmission = sendData();

        let payload = '';
        let error = null;
        socket.onmessage = async (e) => {
            const message = JSON.parse(e.data);
            await transmission;
            switch (message.type) {
            case 'progress':
                callback([
                    STATUS.PROCESSING,
                    {
                        message: message.data,
                    },
                ]);
                break;
            case 'package':
                payload += message.data.payload;
                callback([
                    STATUS.RECEIVING,
                    {
                        loaded: message.data.loaded,
                        total: message.data.total,
                    },
                ]);
                break;
            case 'error':
                error = message.data;
                break;
            default:
                // ignore
            }
        };

        await whileTrue(() => socket.readyState !== socket.CLOSED);

        if (!error) {
            try {
                return resolve(JSON.parse(payload));
            } catch (e) {
                error = e;
            }
        }
        return reject(error);
    });
}

export default send;
export { STATUS as SOCKET_STATUS };
