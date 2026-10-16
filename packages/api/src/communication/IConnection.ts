import { IMessageComposer } from './IMessageComposer';
import { IMessageConfiguration } from './IMessageConfiguration';
import { IMessageEvent } from './IMessageEvent';
import { IConnectionStateSnapshot } from './IConnectionStateSnapshot';

export interface IConnection
{
    init(socketUrl: string): void;
    dispose(): void;
    ready(): void;
    serverDisconnected(reason: number): void;
    authenticated(): void;
    send(...composers: IMessageComposer<unknown[]>[]): void;
    processReceivedData(): void;
    registerMessages(configuration: IMessageConfiguration): void;
    addMessageEvent(event: IMessageEvent): void;
    removeMessageEvent(event: IMessageEvent): void;
    readonly connectionState: Readonly<IConnectionStateSnapshot>;
    isAuthenticated: boolean;
    readonly hasBeenReady: boolean;
    dataBuffer: ArrayBuffer;
}
