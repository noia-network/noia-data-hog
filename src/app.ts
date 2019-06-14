import * as sql from "mysql";
import { DataHogServer } from "./server";
import { DataHogMySql } from "./database";
import { NodeEvents } from "./contracts";
import { UptimeHandler } from "./handlers/uptime-handler";
import { LifecycleHandler } from "./handlers/lifecycle-handler";
import { BandwidthHandler } from "./handlers/bandwidth-handler";
import { WhitelistedClientsHandler } from "./handlers/whitelisted-clients-handler";
import { IsAliveHandler } from "./handlers/is-alive-handler";

export class App {
    constructor(config: sql.PoolConfig) {
        this.config = {
            ...config
        };

        // Create connection to database.
        this.database = new DataHogMySql(this.config);

        this.uptimeHandler = new UptimeHandler(this.database);
        this.lifecycleHandler = new LifecycleHandler(this.database);
        this.bandwidthHandler = new BandwidthHandler(this.database);
        this.whitelistedClientsHandler = new WhitelistedClientsHandler(this.database);
        this.isAliveHandler = new IsAliveHandler(this.database);

        // Lifetime events.
        this.server.registerHandler(NodeEvents.Connected, this.lifecycleHandler.getHandler(NodeEvents.Connected));
        this.server.registerHandler(NodeEvents.Disconnected, this.lifecycleHandler.getHandler(NodeEvents.Disconnected));
        this.server.registerHandler(NodeEvents.Alive, this.lifecycleHandler.getHandler(NodeEvents.Alive));
        this.server.registerHandler(NodeEvents.Storage, this.lifecycleHandler.getHandler(NodeEvents.Storage));
        this.server.registerHandler(NodeEvents.Bandwidth, this.lifecycleHandler.getHandler(NodeEvents.Bandwidth));
        this.server.registerHandler(NodeEvents.Metadata, this.lifecycleHandler.getHandler(NodeEvents.Metadata));

        // Uptime events.
        this.server.registerHandler(NodeEvents.Uptime, this.uptimeHandler.getCalculateUptimeHandler());

        // Bandwidth events.
        this.server.registerHandler(NodeEvents.BandwidthUpload, this.bandwidthHandler.getInboundHandler(NodeEvents.BandwidthUpload));
        this.server.registerHandler(
            NodeEvents.BandwidthUploadTotal,
            this.bandwidthHandler.getOutboundHandler(NodeEvents.BandwidthUploadTotal)
        );
        this.server.registerHandler(NodeEvents.BandwidthDownload, this.bandwidthHandler.getInboundHandler(NodeEvents.BandwidthDownload));
        this.server.registerHandler(
            NodeEvents.BandwidthDownloadTotal,
            this.bandwidthHandler.getOutboundHandler(NodeEvents.BandwidthDownloadTotal)
        );
        // Nodestatistics events.
        this.server.registerHandler(
            NodeEvents.bandwidthUploadStatistics,
            this.bandwidthHandler.getInboundHandler(NodeEvents.bandwidthUploadStatistics)
        );
        this.server.registerHandler(
            NodeEvents.bandwidthDownloadStatistics,
            this.bandwidthHandler.getInboundHandler(NodeEvents.bandwidthDownloadStatistics)
        );
        // Whitelisted clients.

        this.server.registerHandler(
            NodeEvents.WhitelistClient,
            this.whitelistedClientsHandler.getNewWhitelistedClientHandler(NodeEvents.WhitelistClient)
        );
        this.server.registerHandler(
            NodeEvents.ListWhitelistedClients,
            this.whitelistedClientsHandler.getListWhitelistedClientsHandler(NodeEvents.ListWhitelistedClients)
        );
        this.server.registerHandler(
            NodeEvents.IsWhitelistedClient,
            this.whitelistedClientsHandler.getIsWhitelistedClientHandler(NodeEvents.IsWhitelistedClient)
        );
        this.server.registerHandler(
            NodeEvents.RemoveWhitelistedClient,
            this.whitelistedClientsHandler.getRemoveWhitelistedClientHandler(NodeEvents.RemoveWhitelistedClient)
        );

        this.server.registerHandler(NodeEvents.IsAlive, this.isAliveHandler.getIsAliveHandler(NodeEvents.IsAlive));
    }

    protected config: sql.PoolConfig;
    protected database: DataHogMySql;
    protected server: DataHogServer = new DataHogServer();
    protected uptimeHandler: UptimeHandler;
    protected lifecycleHandler: LifecycleHandler;
    protected bandwidthHandler: BandwidthHandler;
    protected whitelistedClientsHandler: WhitelistedClientsHandler;
    protected isAliveHandler: IsAliveHandler;

    public listen(port: number): void {
        this.server.listen(port);
    }
}
