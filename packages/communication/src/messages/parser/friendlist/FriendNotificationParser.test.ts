import { IMessageDataWrapper } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { FriendNotificationParser } from './FriendNotificationParser';

const wrapperOf = (values: (number | string)[]): IMessageDataWrapper =>
{
    const queue = [ ...values ];
    const next = (type: 'number' | 'string') =>
    {
        const value = queue.shift();

        if(typeof value !== type) throw new Error(`expected ${ type }, got ${ typeof value }`);

        return value;
    };

    return {
        readInt: () => next('number'),
        readString: () => next('string')
    } as unknown as IMessageDataWrapper;
};

describe('FriendNotificationParser (AIR FriendNotificationMessageParser, 3082)', () =>
{
    it('reads the avatar id string, the type code and the message', () =>
    {
        const parser = new FriendNotificationParser();

        parser.flush();
        expect(parser.parse(wrapperOf([ '42', 1, 'ACH_Login3' ]))).toBe(true);
        expect(parser.avatarId).toBe(42);
        expect(parser.typeCode).toBe(1);
        expect(parser.message).toBe('ACH_Login3');
    });

    it('turns an unreadable avatar id into 0', () =>
    {
        const parser = new FriendNotificationParser();

        parser.flush();
        parser.parse(wrapperOf([ 'x', 3, 'snowwar' ]));
        expect(parser.avatarId).toBe(0);
    });
});
