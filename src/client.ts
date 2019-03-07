import * as WebSocket from "ws";

const ADDRESS = "ws://localhost:8181";

console.info(ADDRESS);
const ws = new WebSocket(ADDRESS);

console.info("Connecting...");

ws.on("error", error => {
    if (error != null) {
        console.error(error);
    }
});

ws.on("message", message => {
    console.info(message);
});

ws.on("open", async () => {
    console.info("Connected.");
    const promises = [];
    for (let index = 1; index <= 1; index++) {
        const f = async () => {
            const parentTimestamp = +new Date();

            // ws.send(
            //     JSON.stringify({
            //         type: "node-uptime",
            //         payload: {
            //             nodeId: "fDoguLeGZHHnp13NO6RM9PPbg5p1iYnAgyEgi1W7",
            //             timestamp: parentTimestamp,
            //             from: 1538992429345
            //         }
            //     })
            // );

            // return;

            // ws.send(
            //     JSON.stringify({
            //         type: "node-whitelist-client",
            //         payload: {
            //             name: `name-${index}`,
            //             nodeId: `safsa`
            //         }
            //     })
            // );

            // ws.send(
            //     JSON.stringify({
            //         type: "node-list-whitelisted-clients",
            //         payload: {
            //             timestamp: "abc"
            //             // name: `name-${index}`,
            //             // nodeId: `safsa`
            //         }
            //     })
            // );

            // ws.send(
            //     JSON.stringify({
            //         type: "node-is-whitelisted-client",
            //         payload: {
            //             nodeId: `example4.com`,
            //             timestamp: parentTimestamp
            //         }
            //     })
            // );

            // ws.send(
            //     JSON.stringify({
            //         type: "node-remove-whitelisted-client",
            //         payload: {
            //             name: `name-${index}`,
            //             nodeId: `example3.com`
            //         }
            //     })
            // );

            // node-remove-whitelisted-client
            // return;

            // ws.send(
            //     JSON.stringify({
            //         type: "node-connected",
            //         payload: {
            //             nodeId: `node-${index}`,
            //             timestamp: parentTimestamp
            //         }
            //     })
            // );

            // console.info("Parent: ", parentTimestamp);
            // ws.send(
            //     JSON.stringify({
            //         type: "node-is-alive",
            //         payload: {
            //             nodeId: `TEST-E`,
            //             minutesOffline: 25
            //         }
            //     })
            // );

            // ws.send(
            //     JSON.stringify({
            //         type: "node-disconnected",
            //         payload: {
            //             nodeId: `node-${index}`,
            //             timestamp: +new Date()
            //         }
            //     })
            // );

            // ws.send(
            //     JSON.stringify({
            //         type: "node-alive",
            //         payload: {
            //             nodeId: `node-${index}`,
            //             timestamp: +new Date(),
            //             parentTimestamp: 1546439402053
            //         }
            //     })
            // );

            // await new Promise(resolve => setTimeout(resolve, 3000));
            // ws.send(
            //     JSON.stringify({
            //         type: "node-alive",
            //         payload: {
            //             nodeId: `node-${index}`,
            //             timestamp: +new Date(),
            //             parentTimestamp: parentTimestamp
            //         }
            //     })
            // );
            // await new Promise(resolve => setTimeout(resolve, 3000));

            // ws.send(
            //     JSON.stringify({
            //         type: "node-alive",
            //         payload: {
            //             nodeId: `node-${index}`,
            //             timestamp: +new Date(),
            //             parentTimestamp: parentTimestamp
            //         }
            //     })
            // );
            // await new Promise(resolve => setTimeout(resolve, 3000));
            // ws.send(
            //     JSON.stringify({
            //         type: "node-alive",
            //         payload: {
            //             nodeId: `node-${index}`,
            //             timestamp: +new Date(),
            //             parentTimestamp: parentTimestamp
            //         }
            //     })
            // );

            // // GB
            // const storageTotal = Math.random() * 1_073_741_824;
            // const storageUsed = Math.random() * 1_073_741_823;
            // const storageAvailable = storageTotal - storageUsed;

            // ws.send(JSON.stringify({
            //     type: "node-metadata",
            //     payload: {
            //         nodeId: `node-${index}`,
            //         timestamp: +new Date(),
            //         bandwidthUpload: Math.random() * 100,
            //         bandwidthDownload: Math.random() * 1000,
            //         latency: Math.random() * 100,
            //         storageTotal: storageTotal,
            //         storageAvailable: storageAvailable,
            //         storageUsed: storageUsed
            //     }
            // }));

            // ws.send(JSON.stringify({
            //     type: "node-bandwidth",
            //     payload: {
            //         nodeId: `node-${index}`,
            //         timestamp: +new Date(),
            //         bandwidthUpload: Math.random() * 100,
            //         bandwidthDownload: Math.random() * 1000,
            //         latency: Math.random() * 100,
            //     }
            // }));

            // ws.send(JSON.stringify({
            //     type: "node-storage",
            //     payload: {
            //         nodeId: `node-${index}`,
            //         timestamp: +new Date(),
            //         storageTotal: storageTotal,
            //         storageAvailable: storageAvailable,
            //         storageUsed: storageUsed
            //     }
            // }));

            // ws.send(
            //     JSON.stringify({
            //         type: "node-alive",
            //         payload: {
            //             nodeId: "node-1",
            //             timestamp: +new Date()
            //         }
            //     })
            // );
            // await new Promise(resolve => setTimeout(resolve, 1000));
        };

        promises.push(f());

        if (index % 10_000 === 0) {
            console.info(`Sent ${index} items. Waiting a second...`);
        }
    }

    console.info("Waiting for all...");
    await Promise.all(promises);
    console.info("Done.");

    setTimeout(() => {
        ws.close();
    }, 5000);
});
