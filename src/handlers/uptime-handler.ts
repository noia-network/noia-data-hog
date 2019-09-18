import { DataHogMySql } from "../database";
import { NodeEvent, DataHogHandler } from "../server";
import * as WebSocket from "ws";
import { NodeEvents } from "../contracts";

export interface UptimeEvent extends NodeEvent {
    from: number;
    to?: number;
    alive?: {
        parentTimestamp: number;
        timestamp: number;
    };
}

interface Record {
    id: string;
    nodeId: string;
    timestamp: number;
    type: string;
    parentTimestamp: number;
}

interface Session {
    start: number;
    end?: number;
}

type RequiredSession = Required<Session>;

const SESSION_ALIVE_INTERVAL = 5 * 60 * 1000;

export class UptimeHandler {
    constructor(protected database: DataHogMySql) {}

    public getCalculateUptimeHandler(): DataHogHandler<UptimeEvent> {
        return async (event, socket) => this.calculateUptime(event, socket);
    }

    protected async calculateUptime(event: UptimeEvent, socket: WebSocket): Promise<void> {
        let previousSessionQuery = `SELECT id, nodeId, timestamp, type, parentTimestamp FROM \`LifetimeEvents\``;
        previousSessionQuery += ` WHERE nodeId = '${event.nodeId}' AND timestamp <= ${event.from} LIMIT 1`;

        const previousSessionResult = await this.database.query(previousSessionQuery);

        let previousSession: Record | undefined = undefined;
        if (previousSessionResult.length !== 0) {
            previousSession = previousSessionResult[0];
        }

        let sessionsFrom = event.from;
        if (previousSession != null) {
            sessionsFrom = previousSession.timestamp;
        }

        let query = `SELECT id, nodeId, timestamp, type, parentTimestamp FROM \`LifetimeEvents\``;
        query += ` WHERE nodeId = '${event.nodeId}' AND timestamp >= ${sessionsFrom}`;

        if (event.to != null) {
            query += ` AND timestamp <= ${event.to}`;
        }

        query += ` ORDER BY timestamp`;

        const result = await this.database.query(query);
        const sessions: Session[] = [];

        for (const record of result) {
            switch (record.type) {
                case NodeEvents.Connected: {
                    sessions.push({
                        start: record.timestamp
                    });
                    break;
                }
                case NodeEvents.Alive: {
                    const session = sessions[sessions.length - 1];

                    if (session == null || session.end != null || session.start !== record.parentTimestamp) {
                        // Bad session, ignoring...
                        // console.warn(
                        // tslint:disable-next-line:max-line-length
                        //     `Record '${record.id}' (${NodeEvents.Alive}) session hasn't been started since ${event.from} (either started before or it's a bad data).`
                        // );
                        continue;
                    }

                    session.end = record.timestamp;
                    break;
                }
                case NodeEvents.Disconnected: {
                    const session = sessions[sessions.length - 1];

                    if (session == null) {
                        // Bad session, ignoring...
                        console.warn(`Record '${record.id}' (${NodeEvents.Alive}) doesn't have previous session since ${event.from}.`);
                        continue;
                    }

                    session.end = record.timestamp;
                    break;
                }
            }

            if (event.alive != null) {
                const session = sessions[sessions.length - 1];
                if (session == null) {
                    continue;
                }

                if (session.start === event.alive.parentTimestamp) {
                    session.end = event.alive.timestamp;
                }
            }
        }

        const lastSession = sessions[sessions.length - 1];
        // If last session hasn't ended, it must have been alive at least until `event.to`.
        if (lastSession != null && lastSession.end == null) {
            const maxUnknownAlive = lastSession.start + SESSION_ALIVE_INTERVAL;
            if (event.to != null) {
                lastSession.end = Math.min(maxUnknownAlive, event.to);
            } else {
                lastSession.end = maxUnknownAlive;
            }
        }

        const endedSessions = sessions.filter(x => x.end != null && x.end > event.from).map(x => x as RequiredSession);

        const durations = endedSessions.map(session => this.calculateSessionUptime(session, event.from, event.to));

        const totalDurationMs = durations.reduce((i, j) => i + j, 0);

        const duration = {
            ...this.msToTime(totalDurationMs),
            nodeId: event.nodeId,
            from: event.from,
            to: event.to,
            timestamp: event.timestamp
        };

        socket.send(JSON.stringify(duration));
    }

    protected calculateSessionUptime(session: RequiredSession, from: number, to?: number): number {
        let start = session.start;
        if (session.start < from) {
            start = from;
        }

        let end = session.end;
        if (to != null && to < session.end) {
            end = to;
        }
        return end - start;
    }

    protected msToTime(ms: number): { total: number; seconds: number; minutes: number; hours: number } {
        const timeInSeconds = Math.floor(ms / 1000);
        const seconds = Math.floor((timeInSeconds % 3600) % 60);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const hours = Math.floor(timeInSeconds / 3600);

        return {
            total: ms,
            seconds,
            hours,
            minutes
        };
    }
}
