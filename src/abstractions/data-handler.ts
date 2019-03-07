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
