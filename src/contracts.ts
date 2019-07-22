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
    Network = "node-network",
    System = "node-system",
    ExternalIpv4 = "node-externalipv4",
    ExternalIpv6 = "node-externalipv6"
}

export interface BaseMessage<TEvent extends NodeEvent = NodeEvent> {
    event: TEvent;
    type: string;
}

export interface NetworkData extends NodeEvent {
    iface: string;
    ifaceName: string;
    mac: string;
    internal: boolean;
    virtual: boolean;
    operstate: string;
    type: string;
    duplex: string;
    mtu: number;
    speed: number;
    interfacesLength: number;
    pingIpv6: boolean;
    ipv4: string;
    ipv6: string;
}

export interface StorageData extends NetworkData {
    storageTotal: number;
    storageAvailable: number;
    storageUsed: number;
    deviceType: string;
    settingsVersion: string;
    platform: string;
    distro: string;
    release: string;
    arch: string;
    iface: string;
    speed: number;
    mac: string;
    interface: string;
    interfacesLength: number;
    ipv4: string;
    ipv6: string;
}

export interface BandwidthData extends NodeEvent {
    bandwidthUpload: number;
    bandwidthDownload: number;
    latency: number;
}

export interface AliveData extends NodeEvent {
    parentTimestamp: number;
}

export interface NetworkMessage extends BaseMessage<NetworkData> {}
export interface StorageMessage extends BaseMessage<StorageData> {}
export interface BandwidthMessage extends BaseMessage<BandwidthData> {}
export interface AliveMessage extends BaseMessage<AliveData> {}
