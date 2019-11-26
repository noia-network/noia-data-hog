import WebSocket from "ws";
import { v4 as uuid } from "uuid";
import { Batch } from "../abstractions/batch";
import { DataHandler } from "../abstractions/data-handler";
import { DataHogMySql } from "../database";
import { NodeEvent, DataHogHandler } from "../server";
import { NodeEvents, BaseMessage } from "../contracts";
import { logger } from "../logger";

export interface WhitelistedClientsEvent extends NodeEvent {
    name: string;
    isWhitelisted: boolean;
}

export class WhitelistedClientsHandler extends DataHandler {
    constructor(protected database: DataHogMySql) {
        super(database);
        // @ts-ignore
        this.whitelistedClientsBatch = new Batch<BaseMessage>(this.whitelistClientBatch.bind(this), 1000, 0);
    }

    protected whitelistedClientsBatch: Batch<BaseMessage>;

    public getNewWhitelistedClientHandler(type: string): DataHogHandler<NodeEvent> {
        return async event => {
            this.whitelistedClientsBatch.batchData([{ event: event, type: type }]);
        };
    }

    public getIsWhitelistedClientHandler(type: string): DataHogHandler<NodeEvent> {
        return async (event, socket) => {
            await this.isWhitelisted(type, event, socket);
        };
    }

    public getRemoveWhitelistedClientHandler(type: string): DataHogHandler<NodeEvent> {
        return async (event, socket) => {
            await this.removeWhitelisted(type, event, socket);
        };
    }

    public getListWhitelistedClientsHandler(type: string): DataHogHandler<NodeEvent> {
        return async (event, socket) => {
            await this.listWhitelisted(type, event, socket);
        };
    }

    protected async listWhitelisted(type: string, event: NodeEvent, socket: WebSocket): Promise<void> {
        const query = `SELECT * FROM WhitelistedClients`;

        try {
            const result = await this.database.query(query);

            socket.send(
                JSON.stringify({
                    nodeId: event.nodeId,
                    timestamp: event.timestamp,
                    whitelistedClients: result
                })
            );
        } catch (err) {
            // TODO: Handle errors
            logger.error(err);
        }
    }

    protected async isWhitelisted(type: string, event: NodeEvent, socket: WebSocket): Promise<void> {
        const query = `SELECT * FROM WhitelistedClients WHERE nodeId = '${event.nodeId}' LIMIT 1`;

        try {
            const result = await this.database.query(query);

            let isWhitelisted: boolean = false;
            if (result != null && Array.isArray(result) && result.length > 0) {
                isWhitelisted = true;
            }

            socket.send(
                JSON.stringify({
                    nodeId: event.nodeId,
                    timestamp: event.timestamp,
                    isWhitelisted: isWhitelisted
                })
            );
        } catch (err) {
            // TODO: Handle errors
            logger.error(err);
        }
    }

    protected async removeWhitelisted(type: string, event: NodeEvent, socket: WebSocket): Promise<void> {
        // @ts-ignore
        if (typeof event.name !== "string" || event.name.length < 1) {
            return;
        }

        // @ts-ignore
        const query = `DELETE FROM WhitelistedClients WHERE name = '${event.name}'`;

        try {
            await this.database.query(query);
        } catch (err) {
            // TODO: Handle errors
            logger.error(err);
        }
    }

    protected async whitelistClientBatch(data: Array<BaseMessage<WhitelistedClientsEvent>>): Promise<void> {
        const groups: { [key: string]: Array<BaseMessage<WhitelistedClientsEvent>> } = {};
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

    protected async processEventGroup<TMessage extends BaseMessage<WhitelistedClientsEvent>>(
        group: TMessage[],
        key: string
    ): Promise<void> {
        if (key === NodeEvents.WhitelistClient) {
            await this.insertRows(
                group,
                "WhitelistedClients(id, name, nodeId)",
                item => `('${uuid()}', '${item.event.name}', '${item.event.nodeId}'),`
            );
        }
    }
}
