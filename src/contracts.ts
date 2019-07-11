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
    BandwidthDownloadStatistics = "node-bandwidth-download"
}

export interface BaseMessage<TEvent extends NodeEvent = NodeEvent> {
    event: TEvent;
    type: string;
}

export interface StorageData extends NodeEvent {
    storageTotal: number;
    storageAvailable: number;
    storageUsed: number;
    arch: string;
    release: string;
    platform: string;
    deviceType: string;
}

export interface BandwidthData extends NodeEvent {
    bandwidthUpload: number;
    bandwidthDownload: number;
    latency: number;
}

export interface AliveData extends NodeEvent {
    parentTimestamp: number;
}

export interface StorageMessage extends BaseMessage<StorageData> {}
export interface BandwidthMessage extends BaseMessage<BandwidthData> {}
export interface AliveMessage extends BaseMessage<AliveData> {}
