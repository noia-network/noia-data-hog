import * as sql from "mysql";

export class DataHogMySql {
    protected connectionPool: sql.Pool | undefined = undefined;
    protected config: sql.PoolConfig;

    constructor(config: sql.PoolConfig) {
        this.config = config;
    }

    protected connectedPool: sql.Pool | undefined;

    // tslint:disable-next-line:no-any
    public async query(q: string): Promise<any> {
        // tslint:disable-next-line:no-any
        return new Promise<any>((resolve, reject) => {
            if (this.connectionPool == null) {
                // throw new Error("MySQL is not ready!");
                if (this.connectionPool == null) {
                    console.info("Config", this.config);
                    this.connectionPool = sql.createPool(this.config);
                }
            }

            this.connectionPool.query(q, (error, results, fields) => {
                if (error) {
                    reject(error);
                    return;
                }
                console.info("The result is: ", results);
                resolve(results);
            });
        });
    }
}
