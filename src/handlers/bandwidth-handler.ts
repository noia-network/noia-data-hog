import * as WebSocket from "ws";
import { v4 as uuid } from "uuid";
import { Batch } from "../abstractions/batch";
import { DataHandler } from "../abstractions/data-handler";
import { DataHogMySql } from "../database";
import { NodeEvent, DataHogHandler } from "../server";
import { NodeEvents, BaseMessage } from "../contracts";

export interface BandwidthEvent extends NodeEvent {
    contentId: string;
    bytesCount: number;
    ip: string;
}

export class BandwidthHandler extends DataHandler {
    constructor(protected database: DataHogMySql) {
        super(database);
        // @ts-ignore
        this.bandwidthBatch = new Batch<BaseMessage>(this.processInboundBandwidthBatch.bind(this), 1000, 0);
    }

    protected bandwidthBatch: Batch<BaseMessage>;

    public getInboundHandler(type: string): DataHogHandler<NodeEvent> {
        return async event => {
            this.bandwidthBatch.batchData([{ event: event, type: type }]);
        };
    }

    public getOutboundHandler(type: string): DataHogHandler<NodeEvent> {
        return async (event, socket) => {
            await this.calculateTotal(type, event, socket);
        };
    }

    protected async calculateTotal(type: string, event: NodeEvent, socket: WebSocket): Promise<void> {
        let table: string;
        switch (type) {
            case NodeEvents.BandwidthUploadTotal: {
                table = "BandwidthUpload";
                break;
            }
            case NodeEvents.BandwidthDownloadTotal: {
                table = "BandwidthDownload";
                break;
            }
            default: {
                throw new Error(`Event '${type}' is not compatible with a method 'calculateTotal'.`);
            }
        }

        const query = `SELECT SUM(bytesCount) as bytesCount FROM \`${table}\` WHERE nodeId='${event.nodeId}' GROUP BY nodeId`;

        try {
            const result = await this.database.query(query);

            let bytesCount = 0;
            if (Array.isArray(result) && result.length > 0 && result[0].bytesCount != null) {
                bytesCount = result[0].bytesCount;
            }

            socket.send(
                JSON.stringify({
                    nodeId: event.nodeId,
                    timestamp: event.timestamp,
                    bytesCount: bytesCount
                })
            );
        } catch (err) {
            // TODO: Handle errors
            console.error(err);
        }
    }

    protected async processInboundBandwidthBatch(data: Array<BaseMessage<BandwidthEvent>>): Promise<void> {
        const groups: { [key: string]: Array<BaseMessage<BandwidthEvent>> } = {};
        for (const item of data) {
            if (groups[item.type] == null) {
                groups[item.type] = [];
            }

            groups[item.type].push(item);
        }

        const keys = Object.keys(groups);
        for (const key of keys) {
            const group = groups[key];
            await this.processEventGroup(group, key);
        }
    }

    protected async processEventGroup<TMessage extends BaseMessage<BandwidthEvent>>(group: TMessage[], key: string): Promise<void> {
        switch (key) {
            case NodeEvents.BandwidthUpload: {
                await this.insertRows(
                    group,
                    "BandwidthUpload(id, nodeId, timestamp, type, bytesCount, contentId, ip)",
                    item =>
                        `('${uuid()}', '${item.event.nodeId}', ${item.event.timestamp}, '${item.type}', ${item.event.bytesCount}, '${
                            item.event.contentId
                        }', '${item.event.ip}'),`
                );
                break;
            }
            case NodeEvents.BandwidthDownload: {
                await this.insertRows(
                    group,
                    "BandwidthDownload(id, nodeId, timestamp, type, bytesCount, contentId, ip)",
                    item =>
                        `('${uuid()}', '${item.event.nodeId}', ${item.event.timestamp}, '${item.type}', ${item.event.bytesCount}, '${
                            item.event.contentId
                        }', '${item.event.ip}'),`
                );
                break;
            }
        }
    }
}
