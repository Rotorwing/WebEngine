class MemoryAutopacker {
    constructor(length){
        this._length = length;
        this.emptyBlocks = [
            this._newBlock(0, length)
        ];
    }
    get length(){
        return this._length;
    }

    expand(newLength){
        if(newLength <= this._length){
            return;
        }
        const newBlock = this._newBlock(this._length, newLength);
        this.emptyBlocks.push(newBlock);
        this._length = newLength;
        this._mergeBlocks();
    }

    _newBlock(start, end){
        const length = end-start;
        return{start, end, length}
    }

    _insertIntoBlock(block, length){
        block.start = block.start + length;
        block.length = block.end - block.start;
        return block;
    }

    _sortBlocks(){
        this.emptyBlocks.sort((a, b)=>a.length-b.length);
    }

    _mergeBlocks(){
        this.sortBlocks();
        for(let i=0; i<this.emptyBlocks.length-1; i++){
            const current = this.emptyBlocks[i];
            const next = this.emptyBlocks[i+1];
            if(current.end === next.start){
                current.end = next.end;
                current.length = current.end - current.start;
                this.emptyBlocks.splice(i+1, 1);
                i--;
            }
        }
    }

    free(start, length){
        const end = start + length;
        const newBlock = this._newBlock(start, end);
        this.emptyBlocks.push(newBlock);
        this._mergeBlocks();
    }

    allocate(length){
        for(let i=0; i<this.emptyBlocks.length; i++){
            const block = this.emptyBlocks[i];
            if(block.length >= length){
                const start = block.start;
                this._insertIntoBlock(block, length);
                if(block.length === 0){
                    this.emptyBlocks.splice(i, 1);
                }
                return start;
            }
        }
        return -1;
    }

}

