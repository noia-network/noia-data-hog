import { NodeEvent } from "../server";
import { BaseMessage } from "../contracts";
import { DataHogMySql } from "../database";

export abstract class DataHandler {
    constructor(protected database: DataHogMySql) {}

    protected async insertRows<TData extends NodeEvent = NodeEvent, TMessage = BaseMessage<TData>>(
        data: TMessage[],
        tableNameAndColumns: string,
        queryValuesConstructor: (item: TMessage) => string
    ): Promise<void> {
        let query = `INSERT INTO ${tableNameAndColumns} VALUES `;

        for (const item of data) {
            query += queryValuesConstructor(item);
        }

        // Remove last comma
        query = query.substring(0, query.length - 1);

        try {
            await this.database.query(query);
        } catch (err) {
            // TODO: Handle errors
            console.error(err);
        }
    }
    protected async nodeUpdateRows<TData extends NodeEvent = NodeEvent, TMessage = BaseMessage<TData>>(
        data: TMessage[],
        queryValuesConstructor: (item: TMessage) => string
    ): Promise<void> {
        let queryUpdate = `UPDATE nodestatistics SET `;

        for (const item of data) {
            queryUpdate += queryValuesConstructor(item);
        }

        try {
            await this.database.query(queryUpdate);
        } catch (err) {
            // TODO: Handle errors
            console.error(err);
        }
    }
    protected async nodeInsertRows<TData extends NodeEvent = NodeEvent, TMessage = BaseMessage<TData>>(
        data: TMessage[],
        tableNameAndColumns: string,
        queryValuesConstructor: (item: TMessage) => string
    ): Promise<void> {
        let queryInsert = `INSERT INTO ${tableNameAndColumns} SELECT `;
        const queryInsert2 = ` AS tmp WHERE NOT EXISTS (SELECT nodeId FROM nodestatistics WHERE nodeId=`;
        const queryInsert3 = `) LIMIT 1;`;

        for (const item of data) {
            const items = queryValuesConstructor(item).split(",");
            queryInsert += items + queryInsert2 + items[1] + queryInsert3;
        }

        try {
            await this.database.query(queryInsert);
        } catch (err) {
            // TODO: Handle errors
            console.error(err);
        }
    }
    protected async executeQuery<TData extends NodeEvent = NodeEvent, TMessage = BaseMessage<TData>>(
        data: TMessage[],
        queryBuilder: (data: TMessage[]) => string
    ): Promise<void> {
        const query = queryBuilder(data);

        try {
            await this.database.query(query);
        } catch (err) {
            // TODO: Handle errors
            console.error(err);
        }
    }
}
