import { NodeEvent } from "./server";

export interface DataHogMessage {
    type: string;
    payload: {};
}

export const enum NodeEvents {
    Connected = "node-connected",
    Disconnected = "node-disconnected",
    Alive = "node-alive",
    IsAlive = "node-is-alive",
    Metadata = "node-metadata",
    Storage = "node-storage",
    Bandwidth = "node-bandwidth",
    Uptime = "node-uptime",
    BandwidthUpload = "node-bandwidth-upload",
    BandwidthUploadTotal = "node-bandwidth-upload-total",
    BandwidthDownload = "node-bandwidth-download",
    BandwidthDownloadTotal = "node-bandwidth-download-total",
    WhitelistClient = "node-whitelist-client",
    ListWhitelistedClients = "node-list-whitelisted-clients",
    IsWhitelistedClient = "node-is-whitelisted-client",
    RemoveWhitelistedClient = "node-remove-whitelisted-client",
    BandwidthUploadStatistics = "node-bandwidth-upload",
    BandwidthDownloadStatistics = "node-bandwidth-download",
    Network = "node-system",
    Ping = "node-ping"
}

export interface BaseMessage<TEvent extends NodeEvent = NodeEvent> {
    event: TEvent;
    type: string;
}

export interface PingData extends NodeEvent {
    toNodeId: string;
    host: string;
    time: number;
    min: number;
    max: number;
    avg: number;
    ipv4: string;
}

export interface NetworkData extends NodeEvent {
    deviceType?: string;
    settingsVersion?: string;
    platform?: string;
    distro?: string;
    release?: string;
    arch?: string;
    iface?: string;
    ifaceName?: string;
    mac?: string;
    internal?: boolean;
    virtual?: boolean;
    operstate?: string;
    type?: string;
    duplex?: string;
    mtu?: number;
    speed?: number;
    pingIpv6?: boolean;
    ipv4?: string;
    ipv6?: string;
    interfacesLength?: number;
}

export interface StorageData extends NodeEvent {
    storageTotal: number;
    storageAvailable: number;
    storageUsed: number;
}

export interface BandwidthData extends NodeEvent {
    bandwidthUpload: number;
    bandwidthDownload: number;
    latency: number;
}

export interface AliveData extends NodeEvent {
    parentTimestamp: number;
}

export interface PingMessage extends BaseMessage<PingData> {}
export interface NetworkMessage extends BaseMessage<NetworkData> {}
export interface StorageMessage extends BaseMessage<StorageData> {}
export interface BandwidthMessage extends BaseMessage<BandwidthData> {}
export interface AliveMessage extends BaseMessage<AliveData> {}
