import * as logdna from "logdna";

const options = {
    hostname: "Data-Hog-Docker",
    ip: "0.0.0.0",
    app: "DataHog",
    env: "Prod",
    index_meta: true,
    handleExceptions: true,
    tags: "DataHog"
};

export let logger = logdna.setupDefaultLogger("log-dna-key", options);
