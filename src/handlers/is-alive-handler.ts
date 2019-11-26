import WebSocket from "ws";
import { DataHandler } from "../abstractions/data-handler";
import { DataHogMySql } from "../database";
import { NodeEvent, DataHogHandler } from "../server";
import { logger } from "../logger";

export interface IsAliveEvent extends NodeEvent {
    isAlive: boolean;
}

const MINUTES_OFFLINE = 15;

export class IsAliveHandler extends DataHandler {
    constructor(protected database: DataHogMySql) {
        super(database);
        // @ts-ignore
    }

    public getIsAliveHandler(type: string): DataHogHandler<NodeEvent> {
        return async (event, socket) => {
            await this.isAlive(type, event, socket);
        };
    }

    protected async isAlive(type: string, event: NodeEvent, socket: WebSocket): Promise<void> {
        const queryOne = `SELECT * FROM LifetimeEvents WHERE nodeId='${event.nodeId}' ORDER BY \`timestamp\` DESC LIMIT 2`;

        try {
            const resultOne = await this.database.query(queryOne);

            let markedAsDisconnected: boolean = false;
            // @ts-ignore
            const caseA: boolean =
                resultOne != null && Array.isArray(resultOne) && resultOne.length > 0 && resultOne[0].type === "node-disconnected";
            const caseB: boolean =
                resultOne != null &&
                Array.isArray(resultOne) &&
                resultOne.length === 2 &&
                (resultOne[0].type === "node-disconnected" || resultOne[1].type === "node-disconnected") &&
                resultOne[0].timestamp === resultOne[1].timestamp;

            if (caseA || caseB) {
                markedAsDisconnected = true;
            }

            let isAlive: boolean = false;
            if (!markedAsDisconnected) {
                // tslint:disable-next-line:max-line-length
                const queryTwo = `SELECT * FROM LifetimeEvents WHERE type IN ('node-alive', 'node-connected') AND nodeId='${
                    event.nodeId
                    // @ts-ignore
                }' AND ROUND(timestamp/1000) >= UNIX_TIMESTAMP(NOW() - INTERVAL ${parseInt(event.minutesOffline) ||
                    MINUTES_OFFLINE} MINUTE) ORDER BY \`timestamp\` DESC LIMIT 1`;

                const resultTwo = await this.database.query(queryTwo);
                if (resultTwo != null && Array.isArray(resultTwo) && resultTwo.length > 0) {
                    isAlive = true;
                }
            }

            socket.send(
                JSON.stringify({
                    nodeId: event.nodeId,
                    timestamp: event.timestamp,
                    isAlive: isAlive
                })
            );
        } catch (err) {
            // TODO: Handle errors
            logger.error(err);
        }
    }
}
