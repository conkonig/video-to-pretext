import './styles.css';
type DevApp = {
    destroy(): void;
};
export declare function startDevApp(root: HTMLElement): Promise<DevApp>;
export {};
