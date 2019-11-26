import sql from "mysql";
import fs from "fs-extra";
import { App } from "./app";
import { logger } from "./logger";

async function main(): Promise<void> {
    let configJson: string;
    const configPath = "./../datahog.config.json";
    logger.info("Reading configuration...");
    try {
        const configBytes = await fs.readFile(configPath);
        logger.info("Successfully read configuration.");
        configJson = configBytes.toString();
        logger.info("JSON parsed.");
    } catch (err) {
        logger.error(`Failed while reading configuration file at: ${configPath}`);
        process.exit(1);
    }

    logger.info("Starting app...");
    const config: sql.PoolConfig = JSON.parse(configJson);
    const app = new App(config);
    let port: number = 8181;
    if (process.env.PORT != null) {
        logger.info(`Using process.env.PORT: '${process.env.PORT}'`);
        // tslint:disable-next-line:no-any
        port = process.env.PORT as any;
    } else {
        logger.info(`Using default port: '${port}'`);
    }
    app.listen(port);
}

main();
