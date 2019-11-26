import { NodeEvent } from "../server";
import { BaseMessage } from "../contracts";
import { DataHogMySql } from "../database";
import { logger } from "../logger";

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
            logger.error(err);
        }
    }
    protected async nodeUpdateRows<TData extends NodeEvent = NodeEvent, TMessage = BaseMessage<TData>>(
        data: TMessage[],
        queryValuesConstructor: (item: TMessage) => string
    ): Promise<void> {
        let queryUpdate = `UPDATE Nodestatistics SET `;

        for (const item of data) {
            queryUpdate += queryValuesConstructor(item);
        }

        try {
            await this.database.query(queryUpdate);
        } catch (err) {
            // TODO: Handle errors
            logger.error(err);
        }
    }
    protected async nodeInsertRows<TData extends NodeEvent = NodeEvent, TMessage = BaseMessage<TData>>(
        data: TMessage[],
        tableNameAndColumns: string,
        queryValuesConstructor: (item: TMessage) => string
    ): Promise<void> {
        let queryInsert = `INSERT INTO ${tableNameAndColumns} SELECT `;
        for (const item of data) {
            queryInsert += queryValuesConstructor(item);
        }

        try {
            await this.database.query(queryInsert);
        } catch (err) {
            // TODO: Handle errors
            logger.error(err);
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
            logger.error(err);
        }
    }
}
