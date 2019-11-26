import logdna from "logdna";

const options = {
    hostname: "DATA-HOG",
    ip: "0.0.0.0",
    index_meta: true,
    handleExceptions: true,
    tags: "DataHog",
    app: "DataHog",
    env: "Prod"
};

export let logger = logdna.setupDefaultLogger("log-dna-key", options);
