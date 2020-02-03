import WebSocket from "ws";
import { v4 as uuid } from "uuid";
import { Batch } from "../abstractions/batch";
import { DataHandler } from "../abstractions/data-handler";
import { DataHogMySql } from "../database";
import { NodeEvent, DataHogHandler } from "../server";
import { NodeEvents, BaseMessage } from "../contracts";
import { logger } from "../logger";

export interface BandwidthEvent extends NodeEvent {
    contentId: string;
    // Available for upload event.
    contentDomain?: string;
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
        let column: string;
        switch (type) {
            case NodeEvents.BandwidthUploadTotal: {
                column = "bandwidthUploadBytesCount";
                break;
            }
            case NodeEvents.BandwidthDownloadTotal: {
                column = "bandwidthDownloadBytesCount";
                break;
            }
            default: {
                logger.error(`Event '${type}' is not compatible with a method 'calculateTotal'.`);
                throw new Error(`Event '${type}' is not compatible with a method 'calculateTotal'.`);
            }
        }

        const query = `SELECT ${column} FROM Nodestatistics WHERE nodeId='${event.nodeId}'`;

        try {
            const result = await this.database.query(query);

            let bytesCount = 0;
            if (Array.isArray(result) && result.length > 0 && result[0][column] != null) {
                bytesCount = result[0][column];
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
            logger.error(err);
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
            await this.processEventGroupUpdate(group, key);
            await this.processEventGroupInsert(group, key);
        }
    }

    protected async processEventGroup<TMessage extends BaseMessage<BandwidthEvent>>(group: TMessage[], key: string): Promise<void> {
        switch (key) {
            case NodeEvents.BandwidthUpload: {
                await this.insertRows(
                    group,
                    "BandwidthUpload(id, nodeId, `timestamp`, `type`, bytesCount, contentId, ip, contentDomain)",
                    item =>
                        `('${uuid()}', '${item.event.nodeId}', ${item.event.timestamp}, '${item.type}', ${item.event.bytesCount}, '${
                            item.event.contentId
                        }', '${item.event.ip}', '${item.event.contentDomain!}'),`
                );
                break;
            }
            case NodeEvents.BandwidthDownload: {
                await this.insertRows(
                    group,
                    "BandwidthDownload(id, nodeId, `timestamp`, `type`, bytesCount, contentId, ip)",
                    item =>
                        `('${uuid()}', '${item.event.nodeId}', ${item.event.timestamp}, '${item.type}', ${item.event.bytesCount}, '${
                            item.event.contentId
                        }', '${item.event.ip}'),`
                );
                break;
            }
        }
    }
    protected async processEventGroupUpdate<TMessage extends BaseMessage<BandwidthEvent>>(group: TMessage[], key: string): Promise<void> {
        if (key === NodeEvents.BandwidthUploadStatistics || key === NodeEvents.BandwidthDownloadStatistics) {
            await this.nodeUpdateRows(
                group,
                item =>
                    `id='${uuid()}', bandwidthUploadBytesCount=bandwidthUploadBytesCount + ${
                        key === NodeEvents.BandwidthUploadStatistics ? item.event.bytesCount : 0
                    }, bandwidthDownloadBytesCount=bandwidthDownloadBytesCount + ${
                        key === NodeEvents.BandwidthDownloadStatistics ? item.event.bytesCount : 0
                    } WHERE nodeId='${item.event.nodeId}'`
            );
        }
    }
    protected async processEventGroupInsert<TMessage extends BaseMessage<BandwidthEvent>>(group: TMessage[], key: string): Promise<void> {
        if (key === NodeEvents.BandwidthUploadStatistics || key === NodeEvents.BandwidthDownloadStatistics) {
            await this.nodeInsertRows(
                group,
                "Nodestatistics(id, nodeId, bandwidthUploadBytesCount, bandwidthDownloadBytesCount)",
                item =>
                    `'${uuid()}', '${item.event.nodeId}', ${key === NodeEvents.BandwidthUploadStatistics ? item.event.bytesCount : 0}, ${
                        key === NodeEvents.BandwidthDownloadStatistics ? item.event.bytesCount : 0
                    } AS tmp WHERE NOT EXISTS (SELECT nodeId FROM Nodestatistics WHERE nodeId='${item.event.nodeId}') LIMIT 1;`
            );
        }
    }
}
