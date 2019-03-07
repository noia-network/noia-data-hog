import * as sql from "mysql";
import * as fs from "fs-extra";
import { App } from "./app";

async function main(): Promise<void> {
    let configJson: string;
    const configPath = "./src/datahog.config.json";
    console.info("Reading configuration...");
    try {
        const configBytes = await fs.readFile(configPath);
        console.info("Successfully read configuration.");
        configJson = configBytes.toString();
        console.info("JSON parsed.");
    } catch (err) {
        console.error(`Failed while reading configuration file at: ${configPath}`);
        process.exit(1);
        return;
    }

    console.info("Starting app...");
    const config: sql.PoolConfig = JSON.parse(configJson);
    const app = new App(config);
    let port: number = 8181;
    if (process.env.PORT != null) {
        console.info(`Using process.env.PORT: '${process.env.PORT}'`);
        // tslint:disable-next-line:no-any
        port = process.env.PORT as any;
    } else {
        console.info(`Using default port: '${port}'`);
    }
    app.listen(port);
}

main();
