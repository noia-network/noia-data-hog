export class Batch<TData> {
    constructor(
        protected operation: (data: TData[]) => Promise<unknown>,
        protected chunkSize: number = 1000,
        protected throttleTime: number = 1000
    ) {}

    protected batchedData: TData[] = [];
    protected currentOperation: Promise<unknown> | undefined;
    protected lastOperationTime: number = 0;

    protected async processNextBatch(): Promise<void> {
        if (this.currentOperation != null) {
            return;
        }

        const currentTime = +new Date();

        const timePassed = currentTime - this.lastOperationTime;
        if (timePassed < this.throttleTime) {
            setTimeout(async () => await this.processNextBatch(), this.throttleTime - timePassed);
            return;
        }

        const currentData = this.batchedData.splice(0, this.chunkSize);

        if (currentData.length === 0) {
            return;
        }

        this.lastOperationTime = currentTime;
        this.currentOperation = this.operation(currentData);
        await this.currentOperation;
        this.currentOperation = undefined;
        this.processNextBatch();
    }

    public batchData(data: TData[]): void {
        this.batchedData.push(...data);
        this.processNextBatch();
    }
}
