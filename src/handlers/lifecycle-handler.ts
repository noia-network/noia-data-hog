import {
    NodeEvents,
    BandwidthData,
    BandwidthMessage,
    StorageMessage,
    StorageData,
    BaseMessage,
    AliveData,
    AliveMessage,
    NetworkMessage,
    NetworkData
} from "../contracts";
import { NodeEvent, DataHogHandler } from "../server";
import { DataHogMySql } from "../database";
import { Batch } from "../abstractions/batch";
import { DataHandler } from "../abstractions/data-handler";
import { v4 as uuid } from "uuid";

export class LifecycleHandler extends DataHandler {
    constructor(protected database: DataHogMySql) {
        super(database);
        this.lifetimeBatch = new Batch<BaseMessage>(this.processLifetimeBatch.bind(this), 1000, 0);
    }

    protected lifetimeBatch: Batch<BaseMessage>;

    public getHandler(type: string): DataHogHandler<NodeEvent> {
        return async event => {
            this.lifetimeBatch.batchData([{ event: event, type: type }]);
        };
    }

    protected async processLifetimeBatch(data: BaseMessage[]): Promise<void> {
        const groups: { [key: string]: BaseMessage[] } = {};
        for (const item of data) {
            if (groups[item.type] == null) {
                groups[item.type] = [];
            }

            groups[item.type].push(item);
        }

        const keys = Object.keys(groups);

        // Start with Connected event processing.
        const indexOfConnected = keys.findIndex(x => x === NodeEvents.Connected);
        if (indexOfConnected !== -1) {
            keys.splice(indexOfConnected, 1);
            keys.unshift(NodeEvents.Connected);
        }

        for (const key of keys) {
            const group = groups[key];
            await this.processEventGroup(group, key);
        }
    }

    protected async processEventGroup<TMessage extends BaseMessage<NodeEvent>>(group: TMessage[], key: string): Promise<void> {
        switch (key) {
            case NodeEvents.Connected: {
                await this.insertRows(
                    group,
                    "LifetimeEvents(id, nodeId, timestamp, type)",
                    item => `('${uuid()}', '${item.event.nodeId}', ${item.event.timestamp}, '${item.type}'),`
                );
                await this.insertRows(
                    group,
                    "LifetimeEvents(id, nodeId, timestamp, type, parentTimestamp)",
                    item =>
                        `('${uuid()}', '${item.event.nodeId}', ${item.event.timestamp}, '${NodeEvents.Alive}', ${item.event.timestamp}),`
                );
                break;
            }
            case NodeEvents.Alive: {
                // tslint:disable-next-line:no-any
                const aliveMessages = (group as any) as AliveMessage[];
                await this.executeQuery<AliveData>(aliveMessages, data => {
                    let query = "update LifetimeEvents set timestamp = case ";

                    const nodeIds = [];
                    for (const item of data) {
                        nodeIds.push(item.event.nodeId);
                        query += `when nodeId = '${item.event.nodeId}' and parentTimestamp IS NOT NULL and parentTimestamp = ${
                            item.event.parentTimestamp
                        } then ${item.event.timestamp}  `;
                    }
                    query += `else timestamp end `;
                    query += `where nodeId in (${nodeIds.map(x => `'${x}'`).join(",")}) and type = 'node-alive' `;
                    return query;
                });
                break;
            }
            case NodeEvents.Disconnected: {
                await this.insertRows(
                    group,
                    "LifetimeEvents(id, nodeId, timestamp, type)",
                    item => `('${uuid()}', '${item.event.nodeId}', ${item.event.timestamp}, '${item.type}'),`
                );
                break;
            }
            case NodeEvents.Metadata:
            case NodeEvents.Bandwidth:
            case NodeEvents.Network:
            case NodeEvents.Storage: {
                if (key === NodeEvents.Metadata || key === NodeEvents.Storage) {
                    // tslint:disable-next-line:no-any
                    const storageMessages = (group as any) as StorageMessage[];
                    await this.insertRows<StorageData>(
                        storageMessages,
                        // tslint:disable-next-line:max-line-length
                        "StorageStatistics(id, nodeId, timestamp, type, total, available, used)",
                        item =>
                            `("${uuid()}", "${item.event.nodeId}", ${item.event.timestamp}, "${NodeEvents.Storage}", ${
                                item.event.storageTotal
                            }, ${item.event.storageAvailable}, ${item.event.storageUsed}),`
                    );
                }
                if (key === NodeEvents.Metadata || key === NodeEvents.Network) {
                    // tslint:disable-next-line:no-any
                    const networkMessages = (group as any) as NetworkMessage[];
                    await this.insertRows<NetworkData>(
                        networkMessages,
                        // tslint:disable-next-line:max-line-length
                        "NodeInformation(id, nodeId, timestamp, arch, `release`, platform, distro, iface, ifaceName, ip4, ip6, ipv6Check, mac, internal, virtual, operstate, type, duplex, mtu, speed, interfaces)",
                        item =>
                            `("${uuid()}", "${item.event.nodeId}", ${item.event.timestamp}, "${item.event.arch}", "${
                                item.event.release
                            }", "${item.event.platform}", "${item.event.distro}", "${item.event.iface}", "${item.event.ifaceName}", "${
                                item.event.ipv4
                            }", "${item.event.ipv6}", ${item.event.pingIpv6}, "${item.event.mac}", ${item.event.internal}, ${
                                item.event.virtual
                            }, "${item.event.operstate}", "${item.event.type}", "${item.event.duplex}", ${item.event.mtu}, ${
                                item.event.speed
                            }, ${item.event.interfacesLength}),`
                    );
                }
                if (key === NodeEvents.Metadata || key === NodeEvents.Bandwidth) {
                    // tslint:disable-next-line:no-any
                    const bandwidthMessages = (group as any) as BandwidthMessage[];
                    await this.insertRows<BandwidthData>(
                        bandwidthMessages,
                        "BandwidthStatistics(id, nodeId, timestamp, type, upload, download, latency)",
                        item =>
                            `('${uuid()}', '${item.event.nodeId}', ${item.event.timestamp}, '${NodeEvents.Bandwidth}', ${
                                item.event.bandwidthUpload
                            }, ${item.event.bandwidthDownload}, ${item.event.latency}),`
                    );
                }
                break;
            }
        }
    }
}
