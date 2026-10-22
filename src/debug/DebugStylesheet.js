const cssStyles = /*css*/ `
  .debug-panel {
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: rgba(36, 38, 46, 0.5);
    color: white;
    padding: 10px;
    font-family: monospace;
    font-size: 12px;
    z-index: 1000;
    border: white ridge 2px;
    border-radius: 5px;
    box-sizing: border-box;

    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #909195bd #00000000;
  }

  .debug-section {
    margin-bottom: 10px;
  }

  .debug-section h3 {
    margin: 0;
    font-size: 14px;
    font-weight: bold;
  }

  .debug-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    padding: 5px;
    box-sizing: border-box;
  }

  .debug-item-label {
    // font-weight: bold;
    margin: 2px;
  }
  .debug-item-label::after {
    content: ":";
  }

  .debug-item-value {
    margin-left: 4px;
    margin-right: 5px;
  }

  .debug-item-memory-bar-container {
    position: relative;
    width: 100%;
    height: 12px;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    margin-top: 5px;
    border-radius: 3px;
    box-sizing: border-box;
  }

  .debug-item-memory-bar {
    box-sizing: border-box;
  }

  .debug-item-title {
    font-weight: bold;
    font-size: 12px;
  }

  .debug-panel button {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    padding: 2px 5px;
    cursor: pointer;
    font-size: 12px;
    margin-right: 5px;
  }
`;

const styleElement = document.createElement('style');
styleElement.textContent = cssStyles;
document.head.appendChild(styleElement);