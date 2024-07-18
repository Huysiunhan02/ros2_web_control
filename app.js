document.addEventListener('DOMContentLoaded', function () {
    const logArea = document.getElementById('log');
    const wsUrlInput = document.getElementById('wsUrl');
    const portInput = document.getElementById('Port');
    const connectBtn = document.getElementById('connectBtn');
    const topicInput = document.getElementById('topic');
    const frequencyInput = document.getElementById('frequency');
    const stampedCheckbox = document.getElementById('stamped');
    const linearSpeedInput = document.getElementById('linearSpeed');
    const angularSpeedInput = document.getElementById('angularSpeed');
    const linearValueSpan = document.getElementById('linearValue');
    const angularValueSpan = document.getElementById('angularValue');

    let isConnected = false;
    let ros = null;
    let cmdVel = null;
    let publishInterval = null;

    function log(message) {
        const now = new Date();
        const timeString = now.toTimeString().split(' ')[0]; // Lấy thời gian giờ:phút:giây
        const logMessage = `<p>${timeString} - ${message}</p>`;
        logArea.insertAdjacentHTML('beforeend', logMessage);
        logArea.scrollTop = logArea.scrollHeight; // Tự động cuộn xuống cuối
    }

    function connect() {
        if (!isConnected) {
            const url = `ws://${wsUrlInput.value}:${portInput.value}`;
            ros = new ROSLIB.Ros({ url });

            ros.on('connection', () => {
                isConnected = true;
                connectBtn.textContent = 'Disconnect';
                connectBtn.classList.remove('not-connected');
                connectBtn.classList.add('connected');
                log('Connected to ROS2 websocket server.');

                const topic = topicInput.value;
                const stamped = stampedCheckbox.checked;
                cmdVel = new ROSLIB.Topic({
                    ros,
                    name: topic,
                    messageType: stamped ? 'geometry_msgs/TwistStamped' : 'geometry_msgs/Twist'
                });
            });

            ros.on('error', (error) => {
                log(`Error connecting to websocket server: ${error}`);
            });

            ros.on('close', () => {
                isConnected = false;
                connectBtn.textContent = 'Connect';
                connectBtn.classList.remove('connected');
                connectBtn.classList.add('not-connected');
                log('Disconnected from ROS2 websocket server.');
            });
        } else {
            if (publishInterval) clearInterval(publishInterval);
            ros.close();
            isConnected = false;
            connectBtn.textContent = 'Connect';
            connectBtn.classList.remove('connected');
            connectBtn.classList.add('not-connected');
            log('Disconnected from ROS2 websocket server.');
        }
    }

    connectBtn.addEventListener('click', connect);

    function sendCommand(linear, angular) {
        if (!isConnected) {
            log('Not connected to websocket server.');
            return;
        }
        if (isConnected && cmdVel) {
            const message = stampedCheckbox.checked
                ? new ROSLIB.Message({
                    header: {
                        stamp: { sec: 0, nanosec: 0 },
                        frame_id: ''
                    },
                    twist: {
                        linear: { x: linear, y: 0, z: 0 },
                        angular: { x: 0, y: 0, z: angular }
                    }
                })
                : new ROSLIB.Message({
                    linear: { x: linear, y: 0, z: 0 },
                    angular: { x: 0, y: 0, z: angular }
                });
            cmdVel.publish(message);
            log('Publish linear: '+linear+'; angular: '+angular);
        }
    }

    const buttons = {
        'btn-forward-left': [1, 1],
        'btn-forward': [1, 0],
        'btn-forward-right': [1, -1],
        'btn-left': [0, 1],
        'btn-stop': [0, 0],
        'btn-right': [0, -1],
        'btn-backward-left': [-1, 1],
        'btn-backward': [-1, 0],
        'btn-backward-right': [-1, -1],
    };

    Object.keys(buttons).forEach(id => {
        let interval;
        const [linear, angular] = buttons[id];
        document.getElementById(id).addEventListener('mousedown', () => {
            if (id === 'btn-stop') {
                if (publishInterval) clearInterval(publishInterval);
            } else {
                interval = setInterval(() => {
                    sendCommand(parseFloat(linearSpeedInput.value) * linear, parseFloat(angularSpeedInput.value) * angular);
                }, 1000 / parseFloat(frequencyInput.value));
                publishInterval = interval;
            }
        });
        document.getElementById(id).addEventListener('mouseup', () => {
            clearInterval(interval);
        });
        document.getElementById(id).addEventListener('mouseleave', () => {
            clearInterval(interval);
        });
    });

    linearSpeedInput.addEventListener('input', () => {
        linearValueSpan.textContent = linearSpeedInput.value;
    });

    angularSpeedInput.addEventListener('input', () => {
        angularValueSpan.textContent = angularSpeedInput.value;
    });

    const tools = document.querySelector('.tools');
    const icon_title = document.querySelector('.icon');
    const card = document.querySelector('.card');
    let cardVisible = true;

    tools.addEventListener('click', () => {
        cardVisible = !cardVisible;
        card.style.bottom = cardVisible ? '10px' : '-270px';
        icon_title.style.transform = cardVisible ? 'none' : 'rotate(180deg)';
    });
});
