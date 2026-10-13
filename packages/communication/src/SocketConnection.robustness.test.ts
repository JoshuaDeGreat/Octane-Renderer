import { IMessageEvent } from '@octane/api';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EvaWireFormat, InvalidMessageLengthError } from './codec';
import { SocketConnection } from './SocketConnection';

type FakeSocket = { readyState: number, close: ReturnType<typeof vi.fn> };

type Internals = {
    _socket: FakeSocket;
    _reconnectAttempt: number;
    _isReconnecting: boolean;
    enqueueAndProcess(data: ArrayBuffer): void;
    handleMessages(...messages: IMessageEvent[]): void;
    onSocketOpened(): void;
    startConnectTimeout(socket: FakeSocket): void;
};

const frame = (length: number, ...body: number[]): ArrayBuffer =>
{
    const bytes = new Uint8Array(4 + body.length);

    new DataView(bytes.buffer).setInt32(0, length);
    bytes.set(body, 4);

    return bytes.buffer;
};

const openConnection = () =>
{
    const connection = new SocketConnection();
    const internals = connection as unknown as Internals;

    internals._socket = { readyState: WebSocket.OPEN, close: vi.fn() };

    return { connection, internals };
};

afterEach(() => vi.useRealTimers());

describe('SocketConnection robustness', () =>
{
    it('closes the connection on a message length the protocol cannot have', () =>
    {
        for(const length of [ -1, 0, 1, EvaWireFormat.MAX_MESSAGE_LENGTH + 1 ])
        {
            const { internals } = openConnection();

            internals.enqueueAndProcess(frame(length, 0, 1));

            expect(internals._socket.close).toHaveBeenCalledWith(4000, 'Malformed message');
        }
    });

    it('waits for the rest of a valid message', () =>
    {
        const { internals } = openConnection();

        internals.enqueueAndProcess(frame(10, 0, 1));

        expect(internals._socket.close).not.toHaveBeenCalled();
    });

    it('rejects a bad length further into the buffer', () =>
    {
        const decoder = new EvaWireFormat();
        const first = new Uint8Array(frame(2, 0, 1));
        const second = new Uint8Array(frame(1, 0));
        const buffer = new Uint8Array(first.length + second.length);

        buffer.set(first, 0);
        buffer.set(second, first.length);

        expect(() => decoder.decode({ dataBuffer: buffer.buffer } as never)).toThrow(InvalidMessageLengthError);
    });

    it('keeps handling a batch when one handler throws', () =>
    {
        const { internals } = openConnection();
        const second = vi.fn();
        const failingHandler = (): void =>
        {
            throw new Error('broken handler');
        };

        internals.handleMessages(
            { callBack: failingHandler } as unknown as IMessageEvent,
            { callBack: second } as unknown as IMessageEvent);

        expect(second).toHaveBeenCalledOnce();
    });

    it('resets the reconnect attempts on login, not when the socket opens', () =>
    {
        const { connection, internals } = openConnection();

        internals._reconnectAttempt = 3;
        internals._isReconnecting = true;
        internals.onSocketOpened();

        expect(internals._reconnectAttempt).toBe(3);

        connection.authenticated();

        expect(internals._reconnectAttempt).toBe(0);
    });

    it('gives up on a socket that stays connecting', () =>
    {
        vi.useFakeTimers();

        const { internals } = openConnection();
        const socket: FakeSocket = { readyState: WebSocket.CONNECTING, close: vi.fn() };

        internals._socket = socket;
        internals.startConnectTimeout(socket);
        vi.advanceTimersByTime(SocketConnection.CONNECT_TIMEOUT_MS);

        expect(socket.close).toHaveBeenCalledOnce();
    });
});
