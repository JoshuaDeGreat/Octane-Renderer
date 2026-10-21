import { IMessageDataWrapper } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { SaveRaidProtectionSettingsComposer } from '../../outgoing/roomsettings/SaveRaidProtectionSettingsComposer';
import { RaidProtectionCapabilityParser } from './RaidProtectionCapabilityParser';
import { RaidProtectionSaveResultParser } from './RaidProtectionSaveResultParser';
import { RaidProtectionSettingsParser } from './RaidProtectionSettingsParser';

const wrapperOf = (values: (number | boolean)[]): IMessageDataWrapper =>
{
    const queue = [ ...values ];
    const next = (type: 'number' | 'boolean') =>
    {
        const value = queue.shift();

        if(typeof value !== type) throw new Error(`expected ${ type }, got ${ typeof value }`);

        return value;
    };

    return {
        readInt: () => next('number'),
        readBoolean: () => next('boolean')
    } as unknown as IMessageDataWrapper;
};

const SNAPSHOT = [ true, 2, 1, 86400, true, 1800, 0, true, 1760000000 ];

describe('raid protection parsers (AIR 2671 / 3877 / 958)', () =>
{
    it('reads the capability', () =>
    {
        const parser = new RaidProtectionCapabilityParser();

        parser.flush();
        expect(parser.parse(wrapperOf([ 42, true ]))).toBe(true);
        expect(parser.roomId).toBe(42);
        expect(parser.canManage).toBe(true);
    });

    it('reads the settings snapshot in AIR order', () =>
    {
        const parser = new RaidProtectionSettingsParser();

        parser.flush();
        expect(parser.parse(wrapperOf([ 42, ...SNAPSHOT ]))).toBe(true);
        expect(parser.settings).toEqual({
            roomId: 42,
            enabled: true,
            sensitivity: 2,
            actionType: 1,
            banDurationSeconds: 86400,
            guardEnabled: true,
            guardDurationSeconds: 1800,
            guardSensitivity: 0,
            incidentActive: true,
            lastRaidAtEpochSeconds: 1760000000
        });
    });

    it('reads the save result with the snapshot after the room id', () =>
    {
        const parser = new RaidProtectionSaveResultParser();

        parser.flush();
        expect(parser.parse(wrapperOf([ 42, RaidProtectionSaveResultParser.RESULT_CONFIRMATION_REQUIRED, ...SNAPSHOT ]))).toBe(true);
        expect(parser.resultCode).toBe(5);
        expect(parser.settings.roomId).toBe(42);
        expect(parser.settings.banDurationSeconds).toBe(86400);
    });

    it('sends the nine save values of RaidProtectionSettingsController.sendSave', () =>
    {
        const composer = new SaveRaidProtectionSettingsComposer(42, true, 1, 0, 3600, false, 900, 1, true);

        expect(composer.getMessageArray()).toEqual([ 42, true, 1, 0, 3600, false, 900, 1, true ]);
    });
});
