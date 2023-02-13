/// <reference types="node" />
export declare type Output = ReadonlyArray<string>;
export interface Options {
    isTTY?: boolean;
}
export interface Inspector {
    output: Output;
    restore: () => void;
}
declare class ConsoleListener {
    private _stream;
    private _options?;
    constructor(stream: NodeJS.WriteStream, options?: Options);
    inspect(): Inspector;
    inspectSync(fn: (output: Output) => void): Output;
}
export declare const stdout: ConsoleListener;
export declare const stderr: ConsoleListener;
export {};
