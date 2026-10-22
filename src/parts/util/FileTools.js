class FileTools {
    static base64ToBlob(b64, type) {
        // console.log('base64ToBlob', b64, type);
        const cut = b64.indexOf(",") + 1;
        const _b64 = b64.substring(cut);
        const bin = atob(_b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new Blob([bytes], { type });
    }

    static bitmapFromBase64(b64, type, onload) {
        const blob = FileTools.base64ToBlob(b64, type);
        createImageBitmap(blob).then(onload).catch(console.error);
    }

    static bitmapFromBase64Async(b64, type) {
        const blob = FileTools.base64ToBlob(b64, type);
        return createImageBitmap(blob);
    }

    static bitmapFromBytes(bytes, type, onload) {
        const blob = new Blob([bytes], { type });
        createImageBitmap(blob).then(onload).catch(console.error);
    }

    static bitmapFromBytesAsync(bytes, type) {
        const blob = new Blob([bytes], { type });
        return createImageBitmap(blob);
    }

    static imageBitmapToTypedArray(imageBitmap) {
        const { width, height } = imageBitmap;
        
        // 1. Initialize a lightweight offscreen canvas
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // 2. Draw the bitmap onto the canvas
        ctx.drawImage(imageBitmap, 0, 0);
        
        // 3. Extract the underlying Uint8ClampedArray
        const imageData = ctx.getImageData(0, 0, width, height);
        return imageData.data; // This is your typed array
    }
}